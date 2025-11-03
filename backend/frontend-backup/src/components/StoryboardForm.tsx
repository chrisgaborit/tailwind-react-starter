import React, { useState } from "react";
import axios from "axios";

interface StoryboardFormData {
  moduleName: string;
  organisationName: string;
  moduleType: string;
  moduleLevel: string;
  tone: string;
  language: string;
  brandGuidelines: string;
  learningOutcomes: string;
  mainContent: string;
  audience: string;
  durationMinutes: number;
}

const StoryboardForm: React.FC = () => {
  const [formData, setFormData] = useState<StoryboardFormData>({
    moduleName: "",
    organisationName: "",
    moduleType: "",
    moduleLevel: "",
    tone: "",
    language: "",
    brandGuidelines: "",
    learningOutcomes: "",
    mainContent: "",
    audience: "",
    durationMinutes: 10,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: name === "durationMinutes" ? parseInt(value) : value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataFile = new FormData();
    formDataFile.append("file", file);

    try {
      const response = await axios.post("/api/upload", formDataFile, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData((prevData) => ({
        ...prevData,
        mainContent: prevData.mainContent + "\n" + response.data.textContent
      }));

    } catch (err) {
      console.error("File upload failed:", err);
      setError("Failed to process uploaded file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post("/api/generate", formData);
      alert("Storyboard generated successfully!");
    } catch (err) {
      setError("Error generating storyboard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 flex justify-center items-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">AI Storyboard Generator</h1>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-2 gap-6">
            <Input name="moduleName" label="Module Name" value={formData.moduleName} onChange={handleChange} />
            <Input name="organisationName" label="Organisation Name" value={formData.organisationName} onChange={handleChange} />
            <Input name="audience" label="Audience" value={formData.audience} onChange={handleChange} />
            <Select name="moduleType" label="Module Type" value={formData.moduleType} onChange={handleChange} options={["Compliance", "Onboarding", "Sales", "Product", "Soft Skills", "Leadership"]} />
            <Select name="moduleLevel" label="Module Level" value={formData.moduleLevel} onChange={handleChange} options={["Level 1", "Level 2", "Level 3", "Level 4"]} />
            <Select name="tone" label="Tone" value={formData.tone} onChange={handleChange} options={["Professional", "Conversational", "Playful", "Serious", "Friendly"]} />
            <Select name="language" label="Language" value={formData.language} onChange={handleChange} options={["English", "French", "German", "Spanish"]} />
            <Input name="durationMinutes" label="Duration (minutes)" type="number" value={formData.durationMinutes} onChange={handleChange} />
          </div>

          <Textarea name="brandGuidelines" label="Brand Guidelines" value={formData.brandGuidelines} onChange={handleChange} />
          <Textarea name="learningOutcomes" label="Learning Outcomes" value={formData.learningOutcomes} onChange={handleChange} />

          <div>
            <label className="block mb-1 font-medium text-gray-700">Upload Content File (PDF, Word, PPT)</label>
            <input type="file" accept=".pdf,.docx,.pptx" onChange={handleFileUpload}
              className="w-full border rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            {uploading && <p className="text-sm text-blue-500 mt-2">Uploading and extracting file...</p>}
          </div>

          <Textarea name="mainContent" label="Main Content (Editable after upload)" value={formData.mainContent} onChange={handleChange} rows={10} />

          {error && <div className="text-red-500 text-center">{error}</div>}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl text-white font-semibold text-lg bg-blue-600 hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Storyboard"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StoryboardForm;

const Input = ({ name, label, type = "text", value, onChange }: any) => (
  <div>
    <label className="block mb-1 font-medium text-gray-700">{label}</label>
    <input name={name} type={type} value={value} onChange={onChange}
      className="w-full border rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
  </div>
);

const Select = ({ name, label, value, onChange, options }: any) => (
  <div>
    <label className="block mb-1 font-medium text-gray-700">{label}</label>
    <select name={name} value={value} onChange={onChange}
      className="w-full border rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
      <option value="">Select</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const Textarea = ({ name, label, value, onChange, rows = 3 }: any) => (
  <div>
    <label className="block mb-1 font-medium text-gray-700">{label}</label>
    <textarea name={name} value={value} onChange={onChange} rows={rows}
      className="w-full border rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
  </div>
);
