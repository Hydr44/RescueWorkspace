// src/pages/SentryTest.jsx
import { useState } from "react";
import { captureException, captureMessage, addBreadcrumb } from "@/lib/sentry";

export default function SentryTest() {
  const [testResult, setTestResult] = useState("");

  const testUndefinedFunction = () => {
    try {
      // This will throw an error
      myUndefinedFunction();
    } catch (error) {
      captureException(error, {
        test: {
          type: "undefined_function",
          location: "SentryTest.jsx",
        },
      });
      setTestResult("✅ Errore inviato a GlitchTip! Controlla errors.rescuemanager.eu");
    }
  };

  const testManualError = () => {
    const error = new Error("Test error from RescueManager Desktop");
    captureException(error, {
      test: {
        type: "manual_test",
        timestamp: new Date().toISOString(),
      },
    });
    setTestResult("✅ Errore manuale inviato a GlitchTip!");
  };

  const testMessage = () => {
    captureMessage("Test message from RescueManager Desktop", "info");
    setTestResult("✅ Messaggio inviato a GlitchTip!");
  };

  const testBreadcrumbs = () => {
    addBreadcrumb("User clicked test button", { action: "test_breadcrumbs" });
    addBreadcrumb("Preparing to throw error", { step: 2 });
    
    const error = new Error("Test error with breadcrumbs");
    captureException(error);
    setTestResult("✅ Errore con breadcrumbs inviato a GlitchTip!");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-6">
        <h1 className="text-2xl font-semibold text-slate-100 mb-2">
          🔍 Sentry/GlitchTip Test
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Testa l'integrazione con GlitchTip error tracking
        </p>

        <div className="space-y-3 mb-6">
          <button
            onClick={testUndefinedFunction}
            className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium transition-colors"
          >
            Test 1: Undefined Function Error
          </button>

          <button
            onClick={testManualError}
            className="w-full px-4 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 font-medium transition-colors"
          >
            Test 2: Manual Error
          </button>

          <button
            onClick={testMessage}
            className="w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-colors"
          >
            Test 3: Info Message
          </button>

          <button
            onClick={testBreadcrumbs}
            className="w-full px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium transition-colors"
          >
            Test 4: Error with Breadcrumbs
          </button>
        </div>

        {testResult && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-emerald-400">{testResult}</p>
            <p className="text-xs text-slate-500 mt-2">
              Vai su{" "}
              <a
                href="https://errors.rescuemanager.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                errors.rescuemanager.eu
              </a>{" "}
              per vedere l'errore
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-300 mb-2">ℹ️ Info</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• DSN: https://06cbf7995d244424b5b2b5ef90541636@errors.rescuemanager.eu/1</li>
            <li>• Environment: {import.meta.env.MODE}</li>
            <li>• User context: automatico da OrgContext</li>
            <li>• Org context: automatico da OrgContext</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
