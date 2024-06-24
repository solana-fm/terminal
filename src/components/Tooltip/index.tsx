import classNames from 'classnames';
import * as React from 'react';

interface TooltipProps {
  className?: string;
  content: string | React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'dark' | 'light';
}

const Tooltip: React.FC<React.PropsWithChildren<TooltipProps>> = ({
  className,
  content,
  disabled = false,
  variant = 'light',
  onClick,
  children,
}) => {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div
        className={classNames(
          'invisible absolute rounded shadow-lg py-1 px-2 right-0 w-full -mt-8 flex justify-center items-center text-center border dark:border-navy-600 border-navy-50 dark:bg-dark-800 bg-light-200 dark:text-grey-50 text-grey-500',
          className,
          {
            'group-hover:visible group-hover:z-50': !disabled,
          },
        )}
      >
        {content}
      </div>
      {children}
    </div>
  );
};

export default Tooltip;
