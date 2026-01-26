"use client";
/*
 * Documentation:
 * Sidebar Collapsible — https://app.subframe.com/d9acfef434d6/library?component=Sidebar+Collapsible_e732d4fd-dae8-4053-bb88-7c02acab53f9
 */

import React from "react";
import { FeatherCircleDashed } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import * as SubframeUtils from "../utils";

interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  selected?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
}

const NavItem = React.forwardRef<HTMLDivElement, NavItemProps>(function NavItem(
  {
    icon = <FeatherCircleDashed />,
    children,
    selected = false,
    rightSlot,
    className,
    ...otherProps
  }: NavItemProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "group/4b5b3cb8 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-neutral-50 active:bg-neutral-100",
        { "bg-brand-50 hover:bg-brand-50 active:bg-brand-100": selected },
        className
      )}
      ref={ref}
      {...otherProps}
    >
      {icon ? (
        <SubframeCore.IconWrapper
          className={SubframeUtils.twClassNames(
            "text-heading-3 font-heading-3 text-neutral-600",
            { "text-brand-700": selected }
          )}
        >
          {icon}
        </SubframeCore.IconWrapper>
      ) : null}
      {children ? (
        <span
          className={SubframeUtils.twClassNames(
            "line-clamp-1 grow shrink-0 basis-0 text-body-bold font-body-bold text-neutral-600",
            { "text-brand-700": selected }
          )}
        >
          {children}
        </span>
      ) : null}
      {rightSlot ? <div className="flex items-center">{rightSlot}</div> : null}
    </div>
  );
});

interface SidebarCollapsibleRootProps
  extends React.HTMLAttributes<HTMLElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  expanded?: boolean;
  className?: string;
}

const SidebarCollapsibleRoot = React.forwardRef<
  HTMLElement,
  SidebarCollapsibleRootProps
>(function SidebarCollapsibleRoot(
  {
    header,
    footer,
    children,
    expanded = false,
    className,
    ...otherProps
  }: SidebarCollapsibleRootProps,
  ref
) {
  return (
    <nav
      className={SubframeUtils.twClassNames(
        "group/e732d4fd flex h-full w-16 flex-col items-start gap-2 cursor-default",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      <div
        className={SubframeUtils.twClassNames(
          "flex w-16 grow shrink-0 basis-0 flex-col items-start border-r border-solid border-neutral-border bg-default-background absolute top-0 bottom-0 transition-all group-hover/e732d4fd:w-60 group-hover/e732d4fd:grow group-hover/e732d4fd:shrink-0 group-hover/e732d4fd:basis-0",
          { "w-60 grow shrink-0 basis-0": expanded }
        )}
      >
        {header ? (
          <div className="flex w-full flex-col items-start gap-2 px-5 py-6">
            {header}
          </div>
        ) : null}
        {children ? (
          <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-1 px-3 py-4 overflow-auto">
            {children}
          </div>
        ) : null}
        {footer ? (
          <div className="flex w-full items-center gap-4 overflow-hidden border-t border-solid border-neutral-border px-4 py-6">
            {footer}
          </div>
        ) : null}
      </div>
    </nav>
  );
});

export const SidebarCollapsible = Object.assign(SidebarCollapsibleRoot, {
  NavItem,
});
