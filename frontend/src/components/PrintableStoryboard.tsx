import type { StoryboardModule, StoryboardFormData, StoryboardScene, StoryboardEvent } from "@/types";
// frontend/src/components/PrintableStoryboard.tsx

import './PrintStyles.css'; // Assuming you have styles for printing

interface PrintableStoryboardProps {
  module: StoryboardModule;
  // Kept formData for cover page details not present in the module object
  formData: StoryboardFormData; 
}

// --- COVER PAGE (Largely Unchanged) ---
const CoverPage: React.FC<PrintableStoryboardProps> = ({ module, formData }) => (
  <div className="page cover-page">
    <h1 className="doc-title">Storyboard</h1>
    <h2>Document Objectives:</h2>
    <ul>
      <li>This storyboard gives the instructional representation of the screen-level content.</li>
      <li>It includes layout references, visual scripting, and narration transcripts.</li>
    </ul>
    <table className="info-table">
      <tbody>
        <tr>
          <td><strong>Customer Name:</strong> {formData.organisationName || 'N/A'}</td>
          <td><strong>Project/Course:</strong> {module.moduleName}</td>
          <td><strong>Module Name:</strong> {module.moduleName}</td>
        </tr>
        <tr>
          <td><strong>El Project Manager:</strong> {formData.projectManager || 'Chris'}</td>
          <td><strong>Instructional Designer:</strong> {formData.instructionalDesigner || 'AI Assistant'}</td>
          <td><strong>SME:</strong> {formData.sme || 'Client SME'}</td>
        </tr>
      </tbody>
    </table>
    <h3>Version History</h3>
    <table className="version-table">
      <thead><tr><th>Date</th><th>Version</th><th>Author</th><th>Description</th></tr></thead>
      <tbody>
        {module.revisionHistory?.map((entry, index) => (
            <tr key={index}>
                <td>{new Date().toLocaleDateString('en-GB')}</td>
                <td>{entry.version}</td>
                <td>{entry.author}</td>
                <td>{entry.description}</td>
            </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- BRIEF PAGE (Largely Unchanged) ---
const BriefPage: React.FC<{ formData: StoryboardFormData }> = ({ formData }) => (
  <div className="page brief-page">
    <h1 className="doc-title">Project Brief / Requirements</h1>
    <ul>
      <li><strong>Seat time:</strong> {formData.duration || 'Not Specified'}</li>
      <li><strong>Interaction level:</strong> {formData.complexityLevel || 'Not Specified'}</li>
      <li><strong>Audio:</strong> Yes</li>
      <li><strong>Authoring Tool:</strong> Storyline</li>
    </ul>
  </div>
);

// =========================================================================
// == NEW COMPONENT TO RENDER A SCENE AS A TABLE (Replaces ScenePage) ==
// =========================================================================
const StoryboardTable: React.FC<{ scene: StoryboardScene }> = ({ scene }) => (
  <div className="page storyboard-page">
    {/* Scene Header */}
    <div className="scene-header">
      <h2 className="scene-title">{scene.pageTitle}</h2>
      <span className="scene-id">{scene.pageNumber}</span>
    </div>
    <p className="scene-type">Type: {scene.screenType}</p>

    {/* The main table for the scene's events */}
    <table className="storyboard-table">
      <thead>
        <tr>
          <th className="th-event">Event</th>
          <th className="th-audio">Audio</th>
          <th className="th-ost">On-Screen Text (OST)</th>
          <th className="th-dev-notes">Internal Development Notes</th>
        </tr>
      </thead>
      <tbody>
        {scene.events?.map((event: StoryboardEvent) => (
          <tr key={event.eventNumber}>
            <td className="td-event">{event.eventNumber}</td>
            <td className="td-audio">{event.audioScript}</td>
            <td className="td-ost">{event.onScreenText}</td>
            <td className="td-dev-notes">
              <div className="dev-notes-wrapper">
                {/* Media Prompt Section */}
                <div className="dev-notes-section media-prompt">
                  <h4>Media Prompt</h4>
                  <p><strong>Type:</strong> {event.internalDevelopmentNotes?.mediaPrompt?.type ?? "N/A"}</p>
                  <p><strong>Style:</strong> {event.internalDevelopmentNotes?.mediaPrompt?.style ?? "N/A"}</p>
                  <p><strong>Description:</strong> {event.internalDevelopmentNotes?.mediaPrompt?.description ?? "N/A"}</p>
                  <p><strong>Colors:</strong> {event.internalDevelopmentNotes?.mediaPrompt?.colorPalette ?? "N/A"}</p>
                </div>
                {/* Other Notes Section */}
                <div className="dev-notes-section">
                   <p><strong>Layout:</strong> {event.internalDevelopmentNotes?.layout ?? "N/A"}</p>
                   <p><strong>Interactions:</strong> {event.internalDevelopmentNotes?.interactions ?? "N/A"}</p>
                   <p><strong>Developer Comments:</strong> {event.internalDevelopmentNotes?.developerComments ?? "N/A"}</p>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


// --- MAIN PRINTABLE STORYBOARD COMPONENT ---
const PrintableStoryboard: React.FC<PrintableStoryboardProps> = ({ module, formData }) => (
  <div className="printable-container">
    <CoverPage module={module} formData={formData} />
    <BriefPage formData={formData} />
    {/* UPDATED: Map over scenes and render the new StoryboardTable component for each one */}
    {module.scenes.map(scene => (
      <StoryboardTable key={scene.pageNumber} scene={scene} />
    ))}
  </div>
);

export default PrintableStoryboard;