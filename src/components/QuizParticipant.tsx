import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function QuizParticipant({ userId }: { userId: string }) {
  const [questionData, setQuestionData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'quiz', 'current'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setQuestionData(data);

        const now = Date.now();
        const start = new Date(data.timestamp.toDate?.() || data.timestamp).getTime();
        const end = start + data.duration * 1000;
        const remaining = Math.floor((end - now) / 1000);
        setTimeLeft(remaining > 0 ? remaining : 0);
      }
    });
    return () => unsub();
  }, []);

  // カウントダウン
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const sendAnswer = async (index: number) => {
    if (timeLeft <= 0 || isAnswered) return;

    await setDoc(doc(db, 'answers', userId), {
      choiceIndex: index,
      answeredAt: new Date(),
    });
    setIsAnswered(true);
  };

  if (!questionData) return <p>問題待機中...</p>;

  return (
    <div>
      <h3>{questionData.question}</h3>
      <p>残り時間: {timeLeft} 秒</p>
      <ul>
        {questionData.choices.map((choice: string, index: number) => (
          <li key={index}>
            <button
              disabled={timeLeft <= 0 || isAnswered}
              onClick={() => sendAnswer(index)}
            >
              {choice}
            </button>
          </li>
        ))}
      </ul>
      {isAnswered && <p>回答しました！</p>}
      {timeLeft <= 0 && !isAnswered && <p>時間切れ！</p>}
    </div>
  );
}