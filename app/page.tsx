'use client';

import Link from 'next/link';

const features = [
  {
    title: '数クリックでクイズ作成',
    description:
      '直感的なUIで問題文・画像・正解を登録。リアルタイムに編集内容が反映されるので、チームでも安心して運用できます。',
    icon: '🛠️',
  },
  {
    title: 'ライブ集計＆可視化',
    description:
      '回答状況や結果をリアルタイムで監視し、アンサーチェックも即表示。進行と観察を同時にこなせます。',
    icon: '📊',
  },
  {
    title: '参加者も快適な体験',
    description:
      'モバイル最適化されたUI、滑らかなタイマー、パワフルなフィードバックで参加者を飽きさせません。',
    icon: '✨',
  },
];

const steps = [
  {
    title: '1. アカウント作成',
    description:
      'メールアドレスとパスワードでホスト用アカウントを登録。メール確認後すぐにクイズ作成が始められます。',
  },
  {
    title: '2. クイズを登録',
    description:
      '文章や画像付きの設問を最大全10問まで登録。制限時間や解説など、必要な情報をワンストップで設定可能です。',
  },
  {
    title: '3. リンクを共有',
    description:
      '発行された参加用URLを共有するだけ。参加者はブラウザからアクセスし、その場で回答を送信できます。',
  },
  {
    title: '4. ライブ配信',
    description:
      '進行画面でタイマーをスタートし、アンサーチェックや結果発表をワンクリックで操作。会場もオンライン配信もお任せ。',
  },
];

const faqs = [
  {
    question: '料金はかかりますか？',
    answer:
      '現在は無料でご利用いただけます。今後、商用利用に応じたプランを展開予定です。',
  },
  {
    question: '画像サイズに制限はありますか？',
    answer:
      'はい。アップロード時に自動で圧縮・リサイズし、2MB以内に収まるよう最適化しています。',
  },
  {
    question: 'インストールは必要ですか？',
    answer:
      'ブラウザだけで完結します。PC・タブレット・スマートフォンで利用可能です。',
  },
  {
    question: '同時参加者は何人まで？',
    answer:
      'リアルタイムの参加者数に制限はありません。Firebaseのプランに応じてスケールします。',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.2),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_80%,rgba(244,114,182,0.18),transparent)]" />

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-2xl font-bold">
              Q
            </span>
            <div>
              <p className="text-xl font-semibold tracking-wide">QuizLive</p>
              <p className="text-xs text-slate-300/80">瞬間で盛り上げるライブクイズ体験</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/donate"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white hover:text-white"
            >
              寄付する
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white hover:text-white"
            >
              ログイン
            </Link>
            <Link
              href="/host"
              className="rounded-full bg-gradient-to-r from-blue-500 to-blue-400 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:from-blue-400 hover:to-blue-300"
            >
              今すぐ試す
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm text-white/80 backdrop-blur">
            <span className="text-lg">🚀</span>
            新機能: 画像付きクイズと滑らかなライブ結果
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            観客を熱狂させるライブクイズを、誰でも数分で。
          </h1>
          <p className="mt-6 max-w-3xl text-base text-white/70 sm:text-lg">
            QuizLive は、イベントや配信、社内レクリエーション向けに設計されたライブクイズプラットフォーム。
            問題作成・参加者管理・リアルタイム集計をワンストップで提供します。
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/host"
              className="rounded-full bg-gradient-to-r from-blue-500 to-teal-400 px-8 py-3 text-base font-semibold text-white shadow-xl shadow-blue-500/40 transition hover:scale-[1.01] hover:from-blue-400 hover:to-teal-300"
            >
              無料でホストを始める
            </Link>
            <Link
              href="/donate"
              className="rounded-full border border-white/40 px-8 py-3 text-base font-semibold text-white/90 transition hover:border-white hover:text-white"
            >
              開発を支援する
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/40 px-8 py-3 text-base font-semibold text-white/90 transition hover:border-white hover:text-white"
            >
              ログインして続きから再開
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/60">
            登録不要の参加者URLで誰でもすぐ回答できます。寄付でプロジェクトを応援いただけます。
          </p>
        </div>
      </header>

      <main className="relative z-10 space-y-24 pb-24">
        <section className="mx-auto max-w-6xl px-6 mt-16">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/20 backdrop-blur transition hover:translate-y-[-4px] hover:bg-white/10"
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">3分で分かる使い方</h2>
            <p className="mt-3 text-white/60">
              ホストも参加者も迷わないシンプルなプロセス。初めてでもすぐにライブクイズが開催できます。
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-6 shadow-lg shadow-black/10 backdrop-blur"
              >
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 p-10 shadow-xl shadow-blue-900/30 backdrop-blur">
            <div className="flex flex-col gap-8 md:flex-row md:items-center">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">感動のあるクイズイベントを。</h2>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  ライブ会場、ウェビナー、学習イベント、社内研修ーーあらゆるシーンで QuizLive が活躍します。
                  制限時間アニメーションや回答フィードバックなど、参加者が熱中する仕掛けを多数搭載。
                </p>
              </div>
              <div className="md:w-1/2">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-lg shadow-blue-900/20">
                  <ul className="space-y-3 text-sm text-white/80">
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-xl">✅</span>
                      <p>ホスト画面から参加リンクを即発行。共有もラクラク。</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-xl">✅</span>
                      <p>参加者画面はスマホ最適化済み。滑らかなタイマーとアニメーション。</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-xl">✅</span>
                      <p>回答状況・結果をリアルタイム集計。アンサーチェックもワンタップ。</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-xl">✅</span>
                      <p>画像付き設問を自動圧縮＆最適化。アップロードもスムーズです。</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">よくあるご質問</h2>
            <p className="mt-3 text-white/60">導入前の不安を解消するためのFAQをご用意しました。</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-white/10 bg-white/5 px-6 py-4 shadow-lg shadow-black/10 backdrop-blur"
              >
                <summary className="flex cursor-pointer items-center justify-between text-left text-white">
                  <span className="text-sm font-semibold">{faq.question}</span>
                  <span className="text-xl transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-white/70">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-black/30 py-10 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-sm text-white/60 md:flex-row">
          <p>© {new Date().getFullYear()} QuizLive. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white">
              ログイン
            </Link>
            <Link href="/host" className="hover:text-white">
              ホスト用ダッシュボード
            </Link>
            <Link href="/participant" className="hover:text-white">
              参加者用リンク
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
