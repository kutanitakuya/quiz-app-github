'use client';

import Link from 'next/link';

const scenes = [
  { title: '忘年会・新年会', description: '部署対抗や豪華景品の抽選にぴったり。', emoji: '🎉' },
  { title: '結婚式余興', description: '新郎新婦のクイズでゲスト全員が大盛り上がり。', emoji: '💒' },
  { title: '会社イベント', description: '社内表彰や研修にも使えるインタラクティブ演出。', emoji: '🏢' },
  { title: '学校・地域イベント', description: '文化祭や町内イベントで子どもから大人まで楽しめる。', emoji: '🏫' },
];

const features = [
  {
    title: 'リアルタイム集計',
    body: '回答状況が秒単位で変動。番組さながらの緊張感で盛り上がります。',
    icon: '📊',
  },
  {
    title: '10問まで無料作成',
    body: 'お試し利用に十分なボリューム。課金なしで全機能を体験できます。',
    icon: '🎁',
  },
  {
    title: 'スマホ参加OK',
    body: 'URLやQRコードを配るだけ。アプリ不要で誰でもすぐ参加。',
    icon: '📱',
  },
  {
    title: '司会者モード',
    body: 'スタート・締切・正解発表をワンタップで操作。進行が驚くほど楽に。',
    icon: '🎤',
  },
];

const steps = [
  { step: '1', title: 'クイズを作る', detail: '問題文・画像・正解を入力するだけ。' },
  { step: '2', title: 'URL/QRを共有', detail: '参加者はスマホでアクセスして待機。' },
  { step: '3', title: '司会者がスタート', detail: 'リアルタイムに集計しながらイベントを盛り上げる！' },
];

const reviews = [
  {
    quote: '忘年会で一番盛り上がりました。タイマー演出が最高！',
    name: '広告代理店 / 幹事 A さん',
  },
  {
    quote: '結婚式の余興で新郎新婦クイズを実施。ゲスト全員が参加できて大満足でした。',
    name: '新郎新婦のお友だち B さん',
  },
  {
    quote: '司会がボタンひとつで進められるので、当日の段取りがぐっと楽になりました。',
    name: 'IT企業 / 司会 C さん',
  },
];

const faqs = [
  { q: '何人まで参加できますか？', a: 'Firebase を利用しているため数百人規模でも問題ありません。' },
  { q: 'スマホだけで参加できますか？', a: 'ブラウザがあればOK。アプリのインストールは不要です。' },
  { q: '無料で使えますか？', a: 'はい。10問までのクイズ作成やライブ配信は無料です。' },
  { q: '機械や専用の知識は必要ですか？', a: '必要ありません。司会者画面のボタンを押すだけで進行できます。' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-sky-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.2),transparent)]" />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-amber-600 shadow">
              新しいイベント定番ツール
            </p>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              オールスター感謝祭風のクイズを、あなたのイベントに。
            </h1>
            <p className="text-lg text-slate-600">
              スマホで参加・リアルタイム集計。忘年会や結婚式・会社イベントで誰でも番組MCの気分に。
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/host"
                className="rounded-full bg-rose-500 px-8 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-400"
              >
                無料でクイズを作る
              </Link>
              <Link
                href="/participant"
                className="rounded-full border border-rose-200 px-8 py-3 text-center text-sm font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
              >
                デモを見る
              </Link>
            </div>
            <p className="text-xs text-slate-500">インストール不要・ブラウザだけで完結します。</p>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-rose-200">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-rose-100 via-orange-50 to-white p-4 shadow-inner">
                <div className="h-full w-full rounded-2xl border border-dashed border-white/60 bg-white/80 p-4 text-center text-sm text-slate-400">
                  アプリ画面のモック（ランキング＋問題）をここに配置
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-20 pb-20">
        {/* scene cards */}
        <section className="bg-amber-50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-rose-500">
                イベントを“誰でも盛り上げられる”ツールです
              </p>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">シーン別の活用例</h2>
              <p className="mt-2 text-slate-600">大人数でも小規模でもOK。参加者全員がスマホで楽しめます。</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {scenes.map((scene) => (
                <div
                  key={scene.title}
                  className="rounded-3xl border border-white/70 bg-white p-6 text-center shadow-sm shadow-orange-100"
                >
                  <div className="text-3xl">{scene.emoji}</div>
                  <h3 className="mt-3 text-lg font-semibold">{scene.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{scene.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* features */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-500">
              番組のようなドキドキ感を実現する機能
            </p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">QuizLive の特徴</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-100"
              >
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* mock demo */}
        <section className="bg-gradient-to-br from-sky-50 to-rose-50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-500">
                デモイメージ
              </p>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">番組風の画面をそのまま再現</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-[40px] border-4 border-white bg-white shadow-2xl">
                  <div className="rounded-[36px] border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-10 text-center text-slate-400">
                    スマホのモックアップ（問題画面）
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-white bg-white p-6 text-center text-slate-400 shadow">
                  ライブ回答状況のイメージ
                </div>
                <div className="rounded-3xl border border-white bg-white p-6 text-center text-slate-400 shadow">
                  ランキング画面のイメージ
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* steps */}
        <section className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-500">
              準備はたった3ステップ
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">誰でもすぐ始められます</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.step} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 font-semibold text-rose-500">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* reviews */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-rose-500">
                利用者の声
              </p>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">
                使ってみたら、イベントが本当に “変わった”！
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.map((review) => (
                <div key={review.quote} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-100">
                  <p className="text-sm text-slate-700">“{review.quote}”</p>
                  <p className="mt-4 text-xs font-semibold text-slate-500">{review.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">よくある質問</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">FAQ</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between text-left text-base font-semibold text-slate-800">
                  <span>{faq.q}</span>
                  <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* final CTA */}
        <section className="bg-gradient-to-r from-rose-500 to-sky-500 py-16 text-white">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center">
            <h2 className="text-3xl font-extrabold">
              あなたのイベントを、もっとワクワクさせよう！
            </h2>
            <p className="max-w-3xl text-sm text-white/90">
              スマホ1つで、司会者も参加者も、番組のような興奮を味わえます。今すぐ無料でクイズを作ってみませんか？
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/host"
                className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-rose-500 shadow-lg shadow-rose-200 hover:bg-rose-50"
              >
                無料でクイズを作る
              </Link>
              <Link
                href="/participant"
                className="rounded-full border border-white/60 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                デモを見る
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-sm text-slate-500 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-xl font-bold text-rose-500">QuizLive</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-700">
              ログイン
            </Link>
            <Link href="/host" className="hover:text-slate-700">
              ホスト用ダッシュボード
            </Link>
            <Link href="/donate" className="hover:text-slate-700">
              寄付する
            </Link>
            <Link href="/participant" className="hover:text-slate-700">
              参加者デモ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
