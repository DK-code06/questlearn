const axios = require("axios");

// ✅ FIX 1: Set base64_encoded to true to bypass Firewall limits for C++/Java
const JUDGE0_URL = "https://ce.judge0.com/submissions?base64_encoded=true&wait=true";

const languageIds = {
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  javascript: 63,
};

// --- Base64 Helpers ---
const encodeBase64 = (str) => Buffer.from(String(str || "")).toString("base64");
const decodeBase64 = (str) => (str ? Buffer.from(str, "base64").toString("utf-8") : "");

// ✅ FIX 2: Universal Normalizer
// Strips extra trailing spaces or newlines so students aren't punished for invisible formatting
const normalizeOutput = (value) => {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
};

const sanitizeMessage = (message) => {
  if (!message) return null;
  return String(message).replace(/\r\n/g, "\n").trim().slice(0, 2000) || null;
};

const verdictToOverallResult = (verdict) => {
  if (verdict === "Accepted") return "accepted";
  if (verdict === "Wrong Answer") return "wrong_answer";
  if (verdict === "Time Limit Exceeded") return "time_limit_exceeded";
  if (verdict === "Compilation Error") return "compilation_error";
  return "runtime_error";
};

const mapJudgeResultToStatus = (judgeData, expectedOutput) => {
  const statusDescription = String(judgeData?.status?.description || "").toLowerCase();
  const statusId = judgeData?.status?.id;
  
  // ✅ FIX 3: Decode incoming data from Judge0
  const compileOutput = sanitizeMessage(decodeBase64(judgeData?.compile_output));
  const stderr = sanitizeMessage(decodeBase64(judgeData?.stderr));
  const stdout = decodeBase64(judgeData?.stdout);
  
  const time = Number(judgeData?.time || 0) || 0;
  const memory = Number(judgeData?.memory || 0) || 0;

  if (compileOutput) {
    return {
      status: "Compilation Error",
      userOutput: normalizeOutput(stdout),
      errorMessage: compileOutput,
      executionTime: time,
      memoryUsed: memory,
      passed: false,
    };
  }

  if (statusId === 5 || statusDescription.includes("time limit")) {
    return {
      status: "Time Limit Exceeded",
      userOutput: normalizeOutput(stdout),
      errorMessage: sanitizeMessage(stderr) || "Time limit exceeded",
      executionTime: time,
      memoryUsed: memory,
      passed: false,
    };
  }

  if (stderr || (statusId && statusId !== 3 && statusDescription.includes("runtime"))) {
    return {
      status: "Runtime Error",
      userOutput: normalizeOutput(stdout),
      errorMessage: stderr || sanitizeMessage(judgeData?.message) || "Runtime error",
      executionTime: time,
      memoryUsed: memory,
      passed: false,
    };
  }

  const normalizedActual = normalizeOutput(stdout);
  const normalizedExpected = normalizeOutput(expectedOutput);
  const passed = normalizedActual === normalizedExpected;

  return {
    status: passed ? "Passed" : "Failed",
    userOutput: normalizedActual,
    errorMessage: null,
    executionTime: time,
    memoryUsed: memory,
    passed,
  };
};

const runJudge = async (sourceCode, languageId, stdin) => {
  const response = await axios.post(
    JUDGE0_URL,
    {
      // ✅ FIX 4: Encode outgoing data to bypass WAF
      source_code: encodeBase64(sourceCode),
      language_id: languageId,
      stdin: encodeBase64(stdin),
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  return response.data || {};
};

const evaluateSubmission = async ({ code, language, testCases, mode }) => {
  const languageId = languageIds[language];
  if (!languageId) {
    throw new Error("Unsupported language");
  }
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new Error("No test cases available for evaluation");
  }
  if (!["run", "submit"].includes(mode)) {
    throw new Error("Invalid evaluation mode");
  }

  const runModeResults = [];
  const submitStorageResults = [];
  let totalExecutionTime = 0;
  let passedCases = 0;

  for (let i = 0; i < testCases.length; i += 1) {
    const testCase = testCases[i];
    // Check for output depending on the schema shape (output vs expectedOutput)
    const expectedAnswer = testCase.output || testCase.expectedOutput || "";
    let mapped;
    
    try {
      const judgeData = await runJudge(code, languageId, testCase.input || "");
      mapped = mapJudgeResultToStatus(judgeData, expectedAnswer);
    } catch (error) {
      mapped = {
        status: "Runtime Error",
        userOutput: "",
        errorMessage: sanitizeMessage(error?.response?.data?.message || error.message) || "Execution failed",
        executionTime: 0,
        memoryUsed: 0,
        passed: false,
      };
    }

    totalExecutionTime += mapped.executionTime;
    if (mapped.status === "Passed") {
      passedCases += 1;
    }

    if (mode === "run") {
      runModeResults.push({
        caseNumber: i + 1,
        status: mapped.status,
        passed: mapped.status === "Passed",
        input: String(testCase.input || ""),
        // ✅ FIX 5: Match the keys exactly with what the frontend expects
        expected: String(expectedAnswer),
        output: mapped.userOutput || mapped.errorMessage || "No output",
      });
    }

    submitStorageResults.push({
      testcase: {
        passed: mapped.status === "Passed",
        executionTime: mapped.executionTime,
        memoryUsed: mapped.memoryUsed,
      },
    });

    const shouldStop =
      mapped.status === "Compilation Error" ||
      mapped.status === "Runtime Error" ||
      mapped.status === "Time Limit Exceeded" ||
      (mode === "submit" && mapped.status === "Failed");

    if (shouldStop) {
      if (mode === "submit") {
        const verdict =
          mapped.status === "Failed" ? "Wrong Answer" : mapped.status;
        return {
          mode: "submit",
          verdict,
          failedCaseNumber: i + 1,
          executionTime: totalExecutionTime,
          passedCases,
          totalCases: testCases.length,
          storageResults: submitStorageResults,
          overallResult: verdictToOverallResult(verdict),
        };
      }
      if (mapped.status !== "Failed") {
        break;
      }
    }
  }

  if (mode === "run") {
    return {
      mode: "run",
      totalCases: testCases.length,
      passedCases: runModeResults.filter((result) => result.status === "Passed").length,
      results: runModeResults,
    };
  }

  return {
    mode: "submit",
    verdict: passedCases === testCases.length ? "Accepted" : "Wrong Answer",
    failedCaseNumber: passedCases === testCases.length ? null : passedCases + 1,
    executionTime: totalExecutionTime,
    passedCases,
    totalCases: testCases.length,
    storageResults: submitStorageResults,
    overallResult: passedCases === testCases.length ? "accepted" : "wrong_answer",
  };
};

const executeCode = async (code, language, testCases) => {
  const submitResult = await evaluateSubmission({
    code,
    language,
    testCases,
    mode: "submit",
  });

  return {
    results: submitResult.storageResults,
    overallResult: submitResult.overallResult,
  };
};

// ✅ EXPORT AS COMMONJS
module.exports = { evaluateSubmission, executeCode };