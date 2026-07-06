from pathlib import Path
import html
import subprocess
import textwrap


OUT_DIR = Path(r"C:\Users\pc\Downloads\math-equation-evaluation-test-files")
OUT_DIR.mkdir(parents=True, exist_ok=True)

CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
if not CHROME.exists():
    CHROME = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")

CSS = """
@page { size: A4; margin: 18mm; }
body {
  font-family: Tahoma, Arial, sans-serif;
  direction: rtl;
  text-align: right;
  color: #111827;
  line-height: 1.85;
  font-size: 15px;
}
.cover {
  border: 1px solid #d1d5db;
  border-radius: 14px;
  padding: 18px 22px;
  margin-bottom: 18px;
  background: #f8fafc;
}
h1 { font-size: 24px; margin: 0 0 10px; color: #0f766e; }
h2 {
  font-size: 19px;
  margin: 18px 0 8px;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 5px;
}
h3 { font-size: 16px; margin: 14px 0 6px; color: #374151; }
p { margin: 8px 0; }
ul { margin: 6px 0 10px; padding-right: 24px; }
li { margin: 4px 0; }
.meta { color: #4b5563; margin: 4px 0; }
.badge {
  display: inline-block;
  background: #ccfbf1;
  color: #0f766e;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 700;
  margin-top: 8px;
}
.math {
  direction: ltr;
  text-align: left;
  display: block;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  margin: 8px 0;
  font-family: "Courier New", monospace;
}
"""

SUBMISSIONS = [
    {
        "student_id": "220222664",
        "title": "بحث تطبيقي حول حل المعادلات الخطية والتربيعية",
        "body": """
        <h2>1. البحث والشرح الرياضي</h2>
        <p>يهدف هذا البحث إلى توضيح الفرق بين المعادلات الخطية والمعادلات التربيعية، وبيان خطوات حل كل نوع مع تفسير معنى الناتج. المعادلة الخطية تكون على الصورة ax + b = 0، ويكون لها حل واحد إذا كان a لا يساوي صفرًا. أما المعادلة التربيعية فتكون على الصورة ax^2 + bx + c = 0، وقد يكون لها حلان حقيقيان أو حل واحد مكرر أو لا يوجد لها حلول حقيقية حسب قيمة المميز.</p>
        <p>تم استخدام القانون العام للمعادلات التربيعية، مع التحقق من الحل بالتعويض في المعادلة الأصلية. كما تمت مقارنة الحالات المختلفة للمميز: إذا كان أكبر من صفر فهناك حلان، وإذا كان يساوي صفرًا فهناك حل واحد مكرر، وإذا كان أقل من صفر فلا توجد حلول حقيقية.</p>
        <h3>مثال على معادلة خطية</h3>
        <span class="math">3x - 12 = 0<br>x = 12 / 3<br>x = 4</span>
        <p>بالتحقق: 3(4) - 12 = 0، إذن الحل صحيح.</p>
        <h2>2. حل المسائل والتحقق</h2>
        <h3>المسألة الأولى</h3>
        <span class="math">2x^2 - 5x - 3 = 0<br>a = 2, b = -5, c = -3<br>D = b^2 - 4ac = 25 - 4(2)(-3) = 49<br>x = (5 +- 7) / 4<br>x1 = 3, x2 = -0.5</span>
        <p>التحقق: عند x = 3 نحصل على 18 - 15 - 3 = 0، وعند x = -0.5 نحصل على 0.5 + 2.5 - 3 = 0.</p>
        <h3>المسألة الثانية</h3>
        <span class="math">x^2 - 6x + 9 = 0<br>D = 36 - 36 = 0<br>x = 6 / 2 = 3</span>
        <p>الحل مكرر لأن المميز يساوي صفرًا. بالتحقق: 9 - 18 + 9 = 0.</p>
        <h3>المسألة الثالثة</h3>
        <span class="math">x^2 + 4x + 8 = 0<br>D = 16 - 32 = -16</span>
        <p>بما أن المميز سالب، فلا توجد حلول حقيقية. يمكن ذكر الحلول المركبة لكن المطلوب هنا هو الحلول الحقيقية فقط.</p>
        """,
    },
    {
        "student_id": "220222665",
        "title": "تقرير حل معادلات من الدرجة الأولى والثانية",
        "body": """
        <h2>1. البحث والشرح الرياضي</h2>
        <p>المعادلة هي عبارة رياضية تحتوي على مجهول، والهدف هو إيجاد قيمة تجعل الطرفين متساويين. في المعادلات الخطية يتم عزل المجهول باستخدام العمليات العكسية، أما في المعادلات التربيعية فيمكن استخدام التحليل أو القانون العام أو إكمال المربع.</p>
        <p>يعتمد اختيار الطريقة على شكل المعادلة. إذا أمكن تحليل المعادلة بسهولة فهذا أسرع، وإذا كان التحليل غير واضح نستخدم القانون العام. يجب دائمًا التحقق من الحل بالتعويض، لأن الخطأ في الإشارة أو الحساب قد يعطي نتيجة غير صحيحة.</p>
        <h3>القانون العام</h3>
        <span class="math">ax^2 + bx + c = 0<br>x = (-b +- sqrt(b^2 - 4ac)) / 2a</span>
        <p>يسمى المقدار b^2 - 4ac بالمميز، وهو يحدد نوع الحلول.</p>
        <h2>2. حل المسائل والتحقق</h2>
        <h3>المسألة الأولى</h3>
        <span class="math">5x + 10 = 0<br>5x = -10<br>x = -2</span>
        <p>التحقق: 5(-2) + 10 = 0.</p>
        <h3>المسألة الثانية</h3>
        <span class="math">x^2 - 5x + 6 = 0<br>(x - 2)(x - 3) = 0<br>x = 2 or x = 3</span>
        <p>التحقق: عند x = 2 تكون النتيجة 4 - 10 + 6 = 0، وعند x = 3 تكون النتيجة 9 - 15 + 6 = 0.</p>
        <h3>المسألة الثالثة</h3>
        <span class="math">3x^2 + 2x - 1 = 0<br>D = 4 - 4(3)(-1) = 16<br>x = (-2 +- 4) / 6<br>x1 = 1/3, x2 = -1</span>
        <p>تم التحقق بالتعويض، وكلا الحلين يجعل المعادلة تساوي صفرًا.</p>
        """,
    },
    {
        "student_id": "220222666",
        "title": "حل بعض المعادلات الرياضية",
        "body": """
        <h2>1. البحث والشرح الرياضي</h2>
        <p>المعادلات الخطية هي معادلات يكون فيها x بدون أس، أما المعادلات التربيعية يكون فيها x^2. لحل المعادلة الخطية نعزل x. ولحل المعادلة التربيعية يمكن استخدام التحليل أو القانون العام.</p>
        <p>تم ذكر فكرة المميز بشكل مختصر، حيث يساعدنا على معرفة عدد الحلول، لكن لم يتم شرح جميع الحالات بالتفصيل.</p>
        <h2>2. حل المسائل والتحقق</h2>
        <h3>المسألة الأولى</h3>
        <span class="math">4x - 8 = 0<br>x = 2</span>
        <p>التحقق صحيح لأن 4(2) - 8 = 0.</p>
        <h3>المسألة الثانية</h3>
        <span class="math">x^2 - 7x + 10 = 0<br>(x - 5)(x - 2) = 0<br>x = 5, x = 2</span>
        <p>الحلول صحيحة لكن لم يتم شرح سبب اختيار طريقة التحليل.</p>
        <h3>المسألة الثالثة</h3>
        <span class="math">x^2 + 2x + 5 = 0<br>D = 4 - 20 = -16</span>
        <p>تم ذكر أن المميز سالب، لكن لم يتم توضيح النتيجة النهائية بشكل واضح، ولم يتم ذكر أن المعادلة لا تملك حلولًا حقيقية.</p>
        """,
    },
    {
        "student_id": "220222667",
        "title": "واجب معادلات",
        "body": """
        <h2>1. البحث والشرح الرياضي</h2>
        <p>المعادلات مهمة في الرياضيات. المعادلة الخطية سهلة لأنها تحتوي على x، والمعادلة التربيعية تحتوي على x^2.</p>
        <p>يمكن حل المعادلات بطرق مختلفة مثل النقل للطرف الآخر أو استخدام القانون العام.</p>
        <h2>2. حل المسائل والتحقق</h2>
        <h3>المسألة الأولى</h3>
        <span class="math">2x + 6 = 0<br>x = 3</span>
        <p>لم يتم التحقق من الحل، والحل فيه خطأ في الإشارة.</p>
        <h3>المسألة الثانية</h3>
        <span class="math">x^2 - 4 = 0<br>x = 4</span>
        <p>الحل ناقص لأن المعادلة لها حلان، ولم يتم عرض خطوات كافية.</p>
        <h3>المسألة الثالثة</h3>
        <p>لم يتم حل مسألة ثالثة بشكل واضح.</p>
        """,
    },
    {
        "student_id": "220222668",
        "title": "بحث قصير عن المعادلات",
        "body": """
        <h2>مقدمة</h2>
        <p>المعادلات تستخدم في الرياضيات والمدرسة. يوجد أرقام ورموز ونحاول إيجاد قيمة x.</p>
        <p>أحيانًا نستخدم الجمع والطرح والضرب والقسمة. إذا كانت المعادلة صعبة نستخدم طريقة أخرى.</p>
        <h2>حلول</h2>
        <span class="math">x + 2 = 5<br>x = 7</span>
        <p>لا يوجد تحقق، ولا يوجد شرح كاف، ولا توجد مسائل تربيعية صحيحة أو استخدام للمميز أو القانون العام.</p>
        """,
    },
]


def render_pdf(submission: dict[str, str]) -> None:
    html_doc = f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>{html.escape(submission["title"])}</title>
<style>{CSS}</style>
</head>
<body>
  <section class="cover">
    <h1>{html.escape(submission["title"])}</h1>
    <p class="meta"><strong>رقم الطالب:</strong> {submission["student_id"]}</p>
    <p class="meta"><strong>نوع الملف:</strong> واجب بحث وحل معادلات</p>
    <span class="badge">ملف اختبار لتقييم Ollama</span>
  </section>
  {textwrap.dedent(submission["body"]).strip()}
</body>
</html>"""
    html_path = OUT_DIR / f"math_submission_{submission['student_id']}.html"
    pdf_path = OUT_DIR / f"math_submission_{submission['student_id']}.pdf"
    html_path.write_text(html_doc, encoding="utf-8")
    subprocess.run(
        [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            f"--print-to-pdf={pdf_path}",
            html_path.as_uri(),
        ],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


for item in SUBMISSIONS:
    render_pdf(item)

print(OUT_DIR)
for file_path in sorted(OUT_DIR.glob("*.pdf")):
    print(file_path.name)
