import { useState } from "react";
import { Plus, Trash2, X } from "../../icons/lucide.js";

export function CreatePollModal({ open, onClose, onSubmit }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isQuiz, setIsQuiz] = useState(false);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);

  if (!open) return null;

  const handleOptionChange = (index, value) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      if (correctOptionIndex >= index && correctOptionIndex > 0) {
        setCorrectOptionIndex(correctOptionIndex - 1);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!cleanQuestion || cleanOptions.length < 2) return;

    onSubmit?.({
      question: cleanQuestion,
      options: cleanOptions,
      multipleChoice: isQuiz ? false : multipleChoice,
      isAnonymous: isQuiz ? false : isAnonymous,
      isQuiz,
      correctOptionIndex: isQuiz ? correctOptionIndex : null,
    });
    onClose?.();
  };

  const isValid = question.trim() && options.filter((o) => o.trim()).length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        dir="rtl"
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 font-fa"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            ایجاد نظرسنجی یا کوئیز
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Question Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              پرسش یا صورت سوال
            </label>
            <input
              type="text"
              required
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="سوال خود را بنویسید..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-hidden focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:focus:bg-slate-950 transition"
            />
          </div>

          {/* Options Inputs */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              گزینه‌ها (۲ تا ۱۰ مورد)
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {isQuiz ? (
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === idx}
                      onChange={() => setCorrectOptionIndex(idx)}
                      title="انتخاب به عنوان پاسخ صحیح"
                      className="accent-emerald-600 h-4 w-4 cursor-pointer"
                    />
                  ) : null}
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`گزینه ${idx + 1}`}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-hidden focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:focus:bg-slate-950 transition"
                  />
                  {options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 transition cursor-pointer"
                      title="حذف گزینه"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            {options.length < 10 ? (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                <Plus size={15} />
                <span>افزودن گزینه</span>
              </button>
            ) : null}
          </div>

          {/* Settings Toggles */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2.5 text-xs font-medium">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                disabled={isQuiz}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="accent-emerald-600 rounded h-4 w-4 cursor-pointer"
              />
              <span>رأی‌گیری ناشناس (عدم نمایش نام رأی‌دهندگان)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={multipleChoice}
                disabled={isQuiz}
                onChange={(e) => setMultipleChoice(e.target.checked)}
                className="accent-emerald-600 rounded h-4 w-4 cursor-pointer"
              />
              <span>امکان انتخاب چند گزینه همزمان</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isQuiz}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsQuiz(val);
                  if (val) {
                    setIsAnonymous(false);
                    setMultipleChoice(false);
                  }
                }}
                className="accent-emerald-600 rounded h-4 w-4 cursor-pointer"
              />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                حالت کوئیز (آزمون چهارگزینه‌ای با مشخص کردن جواب درست)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition cursor-pointer dark:bg-emerald-500 dark:text-slate-950"
            >
              ارسال نظرسنجی
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
