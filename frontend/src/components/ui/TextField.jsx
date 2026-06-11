const inputClasses =
  'min-h-[52px] w-full rounded-[10px] border border-solid border-[#b8c8d8] bg-[#f6fbff] px-[18px] text-[#111820] outline-none transition placeholder:text-[#aebdca] focus:border-primary focus:ring-4 focus:ring-primary/10';

export default function TextField({ className = '', inputClassName = '', label, ...props }) {
  return (
    <label className={`grid gap-[7px] text-base font-semibold text-[#17212b] ${className}`}>
      {label && <span>{label}</span>}
      <input className={`${inputClasses} ${inputClassName}`} {...props} />
    </label>
  );
}
