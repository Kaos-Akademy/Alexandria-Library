"use client";
/*
 * Documentation:
 * Avatar — https://app.subframe.com/d9acfef434d6/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 * Chat Header — https://app.subframe.com/d9acfef434d6/library?component=Chat+Header_d433f068-1938-4805-865a-295917565aeb
 */

import React from "react";
import * as SubframeUtils from "../utils";
import { Avatar } from "./Avatar";

interface ChatHeaderRootProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: React.ReactNode;
  subtitle?: React.ReactNode;
  buttons?: React.ReactNode;
  className?: string;
}

const ChatHeaderRoot = React.forwardRef<HTMLDivElement, ChatHeaderRootProps>(
  function ChatHeaderRoot(
    { name, subtitle, buttons, className, ...otherProps }: ChatHeaderRootProps,
    ref
  ) {
    return (
      <div
        className={SubframeUtils.twClassNames(
          "flex w-full items-center gap-4",
          className
        )}
        ref={ref}
        {...otherProps}
      >
        <Avatar
          size="large"
          image="https://res.cloudinary.com/subframe/image/upload/v1711417512/shared/btvntvzhdbhpulae3kzk.jpg"
        >
          A
        </Avatar>
        <div className="flex grow shrink-0 basis-0 flex-col items-start">
          {name ? (
            <span className="w-full text-heading-3 font-heading-3 text-default-font">
              {name}
            </span>
          ) : null}
          {subtitle ? (
            <span className="text-body font-body text-subtext-color">
              {subtitle}
            </span>
          ) : null}
        </div>
        {buttons ? (
          <div className="flex items-start gap-2">{buttons}</div>
        ) : null}
      </div>
    );
  }
);

export const ChatHeader = ChatHeaderRoot;
