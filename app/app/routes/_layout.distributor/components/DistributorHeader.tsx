export const DistributorHeader = ({ title }: { title: React.ReactNode }) => {
  return (
    <h1 className="font-semibold leading-[1.2] text-xl md:text-2xl text-base-contrast bg-gradient-to-t from-white to-purple-300 bg-clip-text text-transparent">
      {title}
    </h1>
  );
};
