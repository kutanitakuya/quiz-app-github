import { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { QuizQuestion } from "@/src/types/quiz";

export default function ParticipantPage() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    // Firestore の "currentQuestion" ドキュメントを監視
    const unsubscribe = onSnapshot(doc(db, "quiz", "currentQuestion"), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as QuizQuestion;
        setQuestion(data);
        setSelectedIndex(null);
        setIsAnswered(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAnswer = async (index: number) => {
    if (isAnswered || question == null) return;
    setSelectedIndex(index);
    setIsAnswered(true);

    await addDoc(collection(db, "quiz", "currentQuestion", "answers"), {
      choiceIndex: index,
      answeredAt: serverTimestamp(),
    });
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">クイズに回答しよう！</h1>

      {question ? (
        <div>
          <p className="text-lg font-medium mb-4">{question.question}</p>
          <div className="grid gap-3">
            {question.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
                className={`py-2 px-4 rounded border text-left ${
                  selectedIndex === i
                    ? "bg-blue-500 text-white"
                    : "bg-white hover:bg-blue-100"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>

          {isAnswered && (
            <p className="mt-4 text-green-600 font-semibold">回答を送信しました！</p>
          )}
        </div>
      ) : (
        <p>問題を待っています...</p>
      )}
    </div>
  );
}