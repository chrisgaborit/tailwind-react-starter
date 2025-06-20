"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const Storyboard = () => {
    const [scenes, setScenes] = (0, react_1.useState)([]);
    const [currentSceneIndex, setCurrentSceneIndex] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        // Fetch storyboard data from the backend
        fetch('http://localhost:8080/generate', {
            method: 'POST',
            headers: {
                'x-api-key': 'YOUR_API_KEY', // Replace with your actual API key
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                moduleName: 'Test Module',
                moduleType: 'compliance',
                tone: 'professional',
                language: 'en',
                level: '1',
                duration: 10,
                learningOutcomes: ['Understand safety basics', 'Follow protocol'],
            }),
        })
            .then((response) => response.json())
            .then((data) => setScenes(data))
            .catch((error) => console.error('Error fetching storyboard:', error));
    }, []);
    const handleNextScene = () => {
        // Go to the next scene if available
        setCurrentSceneIndex((prevIndex) => Math.min(prevIndex + 1, scenes.length - 1));
    };
    if (scenes.length === 0) {
        return <div>Loading storyboard...</div>;
    }
    const currentScene = scenes[currentSceneIndex];
    return (<div>
      <h2>{currentScene.title}</h2>
      <p>{currentScene.narrationScript}</p>
      <p>{currentScene.visualDescription}</p>
      <p>{currentScene.onScreenText}</p>

      {/* Render interactions */}
      {currentScene.interactions?.map((interaction, idx) => (<button key={idx} onClick={() => console.log(interaction)}>
          {interaction.action}
        </button>))}

      {/* Next Scene Button */}
      <button onClick={handleNextScene}>Next Scene</button>
    </div>);
};
exports.default = Storyboard;
