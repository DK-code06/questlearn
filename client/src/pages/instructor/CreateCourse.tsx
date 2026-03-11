import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Layout, Image as ImageIcon, X } from 'lucide-react';
import api from '../../utils/api';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    thumbnail: '' // This will now store the Base64 Image string
  });

  const { title, description, category, thumbnail } = formData;

  const onChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // 📸 NEW: Handle Image File Upload
  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData({ ...formData, thumbnail: reader.result as string });
      };
    }
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/courses', formData);
      navigate('/instructor/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.msg || "Error creating course. Image might be too large.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans flex justify-center">
      <div className="w-full max-w-4xl">
        
        <button onClick={() => navigate('/instructor/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} /> Back to Studio
        </button>
        
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
            <Layout className="text-purple-500" /> Create New Course
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT: FORM */}
            <form onSubmit={onSubmit} className="space-y-6">
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Course Title</label>
                    <input 
                        type="text" name="title" value={title} onChange={onChange} required placeholder="e.g. Master ReactJS"
                        className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white focus:border-purple-500 outline-none transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Category</label>
                    <select 
                        name="category" value={category} onChange={onChange}
                        className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white focus:border-purple-500 outline-none"
                    >
                        <option value="General">General</option>
                        <option value="Programming">Programming</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Marketing">Marketing</option>
                    </select>
                </div>

                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Description</label>
                    <textarea 
                        name="description" value={description} onChange={onChange} rows={4} placeholder="What will students learn?"
                        className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white focus:border-purple-500 outline-none"
                    />
                </div>

                {/* 📸 IMAGE UPLOAD SECTION */}
                <div>
                    <label className="block text-gray-400 text-sm font-bold mb-2">Course Thumbnail</label>
                    
                    {!thumbnail ? (
                        <div className="relative border-2 border-dashed border-gray-700 bg-gray-900 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors cursor-pointer group">
                            <Upload size={32} className="mb-2" />
                            <span className="text-sm font-bold">Click to Upload Image</span>
                            <span className="text-xs mt-1 opacity-50">Max size: 2MB</span>
                            {/* Hidden Input */}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    ) : (
                        <div className="relative group">
                            <img src={thumbnail} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-700" />
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, thumbnail: ''})}
                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02]"
                >
                    {loading ? "Uploading..." : "🚀 LAUNCH COURSE"}
                </button>
            </form>

            {/* RIGHT: LIVE PREVIEW */}
            <div className="hidden md:block">
                <h3 className="text-gray-500 font-bold mb-4 uppercase text-xs tracking-wider">Preview</h3>
                <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl opacity-80 hover:opacity-100 transition-opacity sticky top-10">
                    <div className="h-48 bg-gray-800 relative">
                        {thumbnail ? (
                            <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-700 font-black">
                                <ImageIcon size={40} className="mb-2 opacity-50" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-white border border-gray-700">
                            {category}
                        </div>
                    </div>
                    <div className="p-5">
                        <h3 className="font-bold text-xl text-white mb-2">{title || "Your Course Title"}</h3>
                        <p className="text-gray-500 text-sm line-clamp-3">
                            {description || "Course description will appear here..."}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500">BY YOU</span>
                            <span className="text-xs font-bold text-purple-400">0 STUDENTS</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default CreateCourse;