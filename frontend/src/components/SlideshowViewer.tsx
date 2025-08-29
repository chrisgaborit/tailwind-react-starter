

import type { StoryboardScene, KnowledgeCheck } from "@/types";
import React, { useState, useEffect } from 'react';

interface SlideshowViewerProps {
  scenes: StoryboardScene[];
  currentSlideIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onExit: () => void;
}

interface AccordionItemProps {
  title: string;
  content: string | undefined | KnowledgeCheck; // Content can be string or KnowledgeCheck object
  sceneId: string | number; 
  initiallyOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, content, sceneId, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const accordionId = `accordion-${title.toLowerCase().replace(/\s+/g, '-')}-${sceneId}`;

  const isEmptyContent = (val: any): boolean => {
    if (val === undefined || val === null) return true;
    if (typeof val === 'string') {
      const lowerVal = val.trim().toLowerCase();
      return lowerVal === "" || lowerVal === "n/a" || lowerVal === "none" || lowerVal === "none." || lowerVal === "none specified." || lowerVal === "no specific accessibility notes." || lowerVal === "none for this scene.";
    }
    if (typeof val === 'object' && 'question' in val) { // Check if it's a KnowledgeCheck object
        const kc = val as KnowledgeCheck;
        {
          const stem = (kc.question ?? kc.stem ?? "");
          return stem.trim() === "";
        } // Empty if question is empty
    }
    return false;
  };

  if (isEmptyContent(content)) {
    return null; 
  }

  const renderContent = () => {
    if (typeof content === 'object' && content !== null && 'question' in content) {
      const kc = content as KnowledgeCheck;
      return (
        <div className="space-y-2">
          <p><strong>Question:</strong> {(kc.question ?? kc.stem)}</p>
          {kc.options && kc.options.length > 0 && (
            <div>
              <strong>Options:</strong>
              <ul className="list-disc list-inside ml-4">
                {kc.options?.map((opt: any, i: number) => <li key={i}>{(typeof opt === 'string' ? opt : (opt?.text ?? String(opt)))}</li>)}
              </ul>
            </div>
          )}
          {kc.answer && kc.answer.length > 0 && (
             <div>
              <strong>Answer:</strong>
              <ul className="list-disc list-inside ml-4">
                 {kc.answer?.map((ans, i) => <li key={i}>{String(ans)}</li>)}
              </ul>
            </div>
          )}
        </div>
      );
    }
    if (title.toLowerCase().includes('prompt') && typeof content === 'string') {
      return <code className="whitespace-pre-wrap break-all text-emerald-400">{content}</code>;
    }
    if (typeof content === 'string') {
         return <p className="whitespace-pre-wrap">{content}</p>;
    }
    return <p className="whitespace-pre-wrap">Invalid content format.</p>;
  };


  return (
    <div className="border border-slate-700 rounded-md overflow-hidden">
      <h3 className="text-lg font-medium text-slate-100 mb-0">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={accordionId}
          className="flex items-center justify-between w-full p-4 text-left bg-slate-750 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{title}</span>
          <svg
            className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </h3>
      {isOpen && (
        <div id={accordionId} className="p-4 bg-slate-800 text-slate-300 text-sm prose prose-sm prose-invert max-w-none">
          {renderContent()}
        </div>
      )}
    </div>
  );
};


const SlideshowViewer: React.FC<SlideshowViewerProps> = ({
  scenes,
  currentSlideIndex,
  onNext,
  onPrevious,
  onExit,
}) => {
  const currentScene = scenes[currentSlideIndex];

  useEffect(() => {
    // AccordionItem manages its own state, so changing slide won't close them automatically.
  }, [currentSlideIndex]);

  if (!currentScene) {
    return (
      <div className="w-full max-w-4xl text-center p-8 bg-slate-800 rounded-lg shadow-2xl my-8">
        <p className="text-slate-400 text-xl">No scene to display or storyboard is empty.</p>
        <button
            onClick={onExit}
            className="mt-8 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-md transition-colors shadow-md"
        >
            Back to Form
        </button>
      </div>
    );
  }

  const imageUrl = `https://picsum.photos/seed/${String(currentScene.id ?? currentScene.sceneNumber ?? "0")}${currentSlideIndex}/1280/720`;


  return (
    <section aria-labelledby="slideshow-main-title" className="w-full max-w-4xl p-6 sm:p-8 bg-slate-850 shadow-2xl rounded-lg my-8 flex flex-col items-center border border-slate-700"> {/* Slightly different bg: bg-slate-850 */}
      <div className="w-full flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
        <div>
          <h2 id="slideshow-main-title" className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
            {currentScene.title}
          </h2>
          <span className="text-sm font-semibold inline-block py-1 px-3 uppercase rounded-full text-sky-300 bg-sky-700 bg-opacity-50 mt-2">
            Scene {currentScene.sceneNumber}
          </span>
        </div>
        <button
            onClick={onExit}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-md transition-colors text-sm shadow-md"
            aria-label="Exit slideshow and return to grid view"
        >
            Back to Grid View
        </button>
      </div>
      
      <p className="text-slate-400 mb-6 text-lg">
        Viewing scene {currentSlideIndex + 1} of {scenes.length}
      </p>

      <div className="w-full mb-8 rounded-lg overflow-hidden shadow-xl border border-slate-700">
        <img
          src={imageUrl}
          alt={`Visual for scene ${currentScene.sceneNumber}: ${currentScene.title}`}
          className="w-full h-auto object-cover aspect-[16/9] bg-slate-700"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://picsum.photos/1280/720?grayscale&blur=2'; 
            target.alt = 'Fallback placeholder image';
          }}
        />
      </div>

      <div className="w-full space-y-4 mb-8">
        <AccordionItem title="Learning Objectives Covered" content={currentScene.learningObjectivesCovered} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} initiallyOpen={false} />
        <AccordionItem title="Visual Description" content={currentScene.visualDescription} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} initiallyOpen={true} />
        <AccordionItem title="Narration Script" content={currentScene.narrationScript} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} />
        <AccordionItem title="On-Screen Text" content={currentScene.onScreenText} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} />
        <AccordionItem title="User Instructions" content={currentScene.userInstructions} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} />
        <AccordionItem title="Interactions" content={currentScene.interactions} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} />
        <AccordionItem title="Accessibility Notes" content={currentScene.accessibilityNotes} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} />
        <AccordionItem title="Knowledge Check" content={currentScene.knowledgeCheck} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} /> {/* This will now render the object or string */}
        <AccordionItem title="AI Image Prompt" content={currentScene.imagePrompt} sceneId={String(currentScene.id ?? currentScene.sceneNumber ?? "0")} />
      </div>

      <div className="w-full flex justify-between items-center pt-6 border-t border-slate-700">
        <button
          onClick={onPrevious}
          disabled={currentSlideIndex === 0}
          className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed transform hover:enabled:scale-105"
          aria-label="Previous scene"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentSlideIndex === scenes.length - 1}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed transform hover:enabled:scale-105"
          aria-label="Next scene"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default SlideshowViewer;