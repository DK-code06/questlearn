const MAIN_PATTERNS = [
  /\bmain\s*\(/i,
  /public\s+static\s+void\s+main/i,
  /\bint\s+main\s*\(/i
];

const SIGNATURE_PATTERNS = {
  cpp: /\bint\s+solve\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/,
  c: /\bint\s+solve\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/,
  java: /\bstatic\s+int\s+solve\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/,
  python: /\bdef\s+solve\s*\(\s*\w+\s*,\s*\w+\s*\)\s*:/
};

const SUPPORTED_BATTLE_LANGUAGES = ['cpp', 'c', 'java', 'python'];

const validateFunctionOnly = (code, language) => {
  if (!code || !code.trim()) return { valid: false, error: 'Code cannot be empty' };
  if (!SUPPORTED_BATTLE_LANGUAGES.includes(language)) return { valid: false, error: 'Unsupported language' };
  
  for (const pat of MAIN_PATTERNS) {
    if (pat.test(code)) return { valid: false, error: 'Do not include a main method. Just write the solve function.' };
  }
  
  return { valid: true };
};

const wrapFunctionSolution = (code, language) => {
  if (language === 'cpp') {
    return {
      source: `#include <bits/stdc++.h>\nusing namespace std;\n${code}\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  long long a, b;\n  if (!(cin >> a >> b)) return 0;\n  cout << solve((int)a, (int)b);\n  return 0;\n}`
    };
  }
  if (language === 'c') {
    return {
      source: `#include <stdio.h>\n${code}\nint main() {\n  int a, b;\n  if (scanf("%d %d", &a, &b) != 2) return 0;\n  printf("%d", solve(a, b));\n  return 0;\n}`
    };
  }
  if (language === 'java') {
    return {
      source: `import java.io.*;\nimport java.util.*;\npublic class Main {\n${code}\n  public static void main(String[] args) throws Exception {\n    Scanner fs = new Scanner(System.in);\n    if (!fs.hasNextInt()) return;\n    int a = fs.nextInt();\n    int b = fs.nextInt();\n    System.out.print(solve(a, b));\n  }\n}`
    };
  }
  if (language === 'python') {
    return {
      source: `import sys\n${code}\ndef __main():\n    data = sys.stdin.read().strip().split()\n    if len(data) < 2: return\n    res = solve(int(data[0]), int(data[1]))\n    sys.stdout.write(str(res).strip())\nif __name__ == "__main__":\n    __main()`
    };
  }
  return { error: 'Unsupported language' };
};

module.exports = { validateFunctionOnly, wrapFunctionSolution };