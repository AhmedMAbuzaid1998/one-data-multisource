// Brand geometry from https://www.vodafone.com/~/media/Images/V/vodafone/corp/logo/logo-dark.svg
export default function BrandMark({ id = 'brand-mark' }: { id?: string }) {
  return (
    <svg id={id} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle id={`${id}-background`} cx="40" cy="40" r="40" fill="#e60000" />
      <path id={`${id}-symbol`} d="M40.32 62.304c-10.99.037-22.427-9.344-22.475-24.407-.034-9.96 5.34-19.55 12.21-25.236 6.7-5.548 15.878-9.107 24.203-9.135 1.073-.003 2.193.085 2.88.32-7.28 1.51-13.074 8.282-13.048 15.967 0 .254.022.525.048.652 12.18 2.966 17.71 10.316 17.743 20.484.035 10.17-7.994 21.31-21.56 21.356z" fill="white" />
    </svg>
  )
}
