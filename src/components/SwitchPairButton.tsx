import React from 'react';

// changed swap arrow svg to tabler swap svg
const IconSwitchPairDark = () => (
  // <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  //   <path
  //     d="M9.04393 5.74021L12 3.3701L9.04393 1V2.68839H1.0228V4.05189H9.04393V5.74021ZM2.95607 5.34607L0 7.71617L2.95607 10.0863V8.39789H10.9772V7.03439H2.95607V5.34607Z"
  //     fill="grey"
  //     fillOpacity="0.8"
  //   />
  // </svg>
  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-arrows-down-up group-hover:!stroke-purple-500/80" width="14" height="14" viewBox="0 0 24 24" stroke-width="1.5" stroke="#808080" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M17 3l0 18" />
    <path d="M10 18l-3 3l-3 -3" />
    <path d="M7 21l0 -18" />
    <path d="M20 6l-3 -3l-3 3" />
  </svg>
);

const SwitchPairButton = ({
  className,
  onClick,
  disabled,
}: {
  className?: string;
  onClick(): void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex justify-center">
      <div
        onClick={onClick}
        className={`border dark:border-navy-600 border-navy-50 dark:bg-dark-800 bg-light-200 h-8 w-8 rounded-full flex items-center justify-center cursor-pointed group dark:hover:!border-purple-500/80 hover:!border-purple-300/80 hover:shadow-[0px_0px_19px_1px] hover:shadow-purple-500/30 transition-shadow duration-100 ${disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${className}`}
      >
        <div className="block">
          <IconSwitchPairDark />
        </div>
      </div>
    </div>
  );
};

export default SwitchPairButton;
