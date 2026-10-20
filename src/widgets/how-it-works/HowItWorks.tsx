import { Icon, type IconName } from "@/shared/ui/Icon";

const STEPS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: "calendar-check", title: "اقامتتان را انتخاب کنید", text: "واحد و زمان مناسب را ببینید؛ نیم‌روز یا چند شب، انتخاب با شماست." },
  { icon: "phone", title: "با شمارهٔ همراه وارد شوید", text: "بدون ایمیل و رمز عبور. اطلاعاتتان را فقط یک‌بار برای رزرو کامل می‌کنید." },
  { icon: "certificate", title: "گواهی اقامت را بگیرید", text: "رزرو رایگان شما ثبت می‌شود؛ گواهی دارای QR را در پذیرش نشان دهید." },
];

export function HowItWorks() {
  return (
    <section className="how-section" aria-labelledby="how-title">
      <div className="container">
        <div className="how-head">
          <p className="section-eyebrow">ساده، روشن، بی‌دردسر</p>
          <h2 className="section-title" id="how-title">
            سه قدم تا آسودگیِ اقامت
          </h2>
        </div>
        <ol className="how-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="how-step reveal">
              <span className="step-number" aria-hidden="true">
                {["۰۱", "۰۲", "۰۳"][i]}
              </span>
              <h3>
                <Icon name={s.icon} size={20} /> {s.title}
              </h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
