export function HowItWorks() {
  const steps = [
    {
      icon: "distributor/icon-create.svg",
      title: "1. Create profile",
      desc: "Create your distributor profile directly on Orderly One. Not a builder? No problem! You can register as an ambassador.",
    },
    {
      icon: "distributor/icon-refer.svg",
      title: "2. Refer builders",
      desc: "Share your distributor link or code with your network. Builders in your network can use it to setup their DEXes.",
    },
    {
      icon: "distributor/icon-earn.svg",
      title: "3. Earn revenue share",
      desc: "Immediately start earning revenue share once your invitees have successfully setup their DEXes and graduated.",
    },
  ];

  return (
    <section className="py-16">
      <div className="flex flex-col gap-5 max-w-[1088px] mx-auto px-5 lg:px-0">
        <div className="mb-6 flex flex-col items-center text-center gap-2">
          <h2 className="text-[32px] font-semibold leading-[1.2]">
            How it works
          </h2>
          <p className="text-base-contrast/54 text-lg">
            Sign up and start earning in 3 steps:
          </p>
        </div>

        <div className="flex gap-6 max-lg:flex-col">
          {steps.map(step => (
            <div
              className="flex-1 flex flex-col gap-5 p-8 bg-purple-dark border border-line-6 rounded-[20px]"
              key={step.title}
            >
              <div className="w-20 h-20">
                <img src={step.icon} alt="" className="w-full h-full" />
              </div>
              <div className="flex flex-col gap-5">
                <h3 className="text-[32px] font-medium leading-[1.2]">
                  {step.title}
                </h3>
                <p className="text-sm text-base-contrast/54 leading-[1.4]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
