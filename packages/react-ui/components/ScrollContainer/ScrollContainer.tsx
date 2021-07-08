import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import * as LayoutEvents from '../../lib/LayoutEvents';
import { getScrollWidth } from '../../lib/dom/getScrollWidth';
import { CommonWrapper } from '../../internal/CommonWrapper';
import { Nullable } from '../../typings/utility-types';

import {
  ScrollContainerProps,
  ScrollContainerState,
  ScrollType,
  ScrollContainerScrollState,
} from './ScrollContainer.types';
import { defaultScrollState, HIDE_SCROLLBAR_OFFSET, MIN_SCROLL_SIZE } from './ScrollContainer.constants';
import { jsStyles } from './ScrollContainer.styles';

export class ScrollContainer extends React.Component<ScrollContainerProps, ScrollContainerState> {
  public static __KONTUR_REACT_UI__ = 'ScrollContainer';

  public static propTypes = {
    invert: PropTypes.bool,
    maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    scrollBehaviour: PropTypes.oneOf(['auto', 'smooth']),
    preventWindowScroll: PropTypes.bool,
    onScrollStateChange: PropTypes.func,
  };

  public static defaultProps = {
    scrollBehaviour: 'auto',
  };

  public state: ScrollContainerState = {
    scrollX: { ...defaultScrollState },
    scrollY: { ...defaultScrollState },
  };

  private inner: Nullable<HTMLElement>;
  private scrollY: Nullable<HTMLElement>;
  private scrollX: Nullable<HTMLElement>;

  public componentDidMount() {
    this.reflowY();
    this.reflowX();
  }

  public componentDidUpdate(prevProps: ScrollContainerProps) {
    if (this.inner) {
      if (prevProps.preventWindowScroll && !this.props.preventWindowScroll) {
        this.inner.removeEventListener('wheel', this.handleInnerScrollWheel);
      }
      if (!prevProps.preventWindowScroll && this.props.preventWindowScroll) {
        this.inner.addEventListener('wheel', this.handleInnerScrollWheel, { passive: false });
      }
    }
    this.reflowY();
    this.reflowX();
  }

  public render() {
    const props = this.props;

    const scrollY = this.renderScroll('scrollY');
    const scrollX = this.renderScroll('scrollX');

    const padding = HIDE_SCROLLBAR_OFFSET - getScrollWidth();

    const innerStyle: React.CSSProperties = {
      maxHeight: props.maxHeight,
      scrollBehavior: props.scrollBehaviour,
      // hide vertical and horizontal scrollbar with a little extra space
      padding: `0 ${padding}px ${padding}px 0`,
      margin: `0 -${HIDE_SCROLLBAR_OFFSET}px -${HIDE_SCROLLBAR_OFFSET}px 0`,
    };

    const wrapperStyle: React.CSSProperties = {
      maxWidth: props.maxWidth,
    };

    return (
      <CommonWrapper {...this.props}>
        <div
          style={wrapperStyle}
          className={jsStyles.root()}
          onMouseMove={this.handleMouseMove}
          onMouseLeave={this.handleMouseLeave}
        >
          {scrollY}
          {scrollX}
          <div
            data-tid="ScrollContainer__inner"
            className={jsStyles.inner()}
            style={innerStyle}
            ref={this.refInner}
            onScroll={this.handleNativeScroll}
          >
            {props.children}
          </div>
        </div>
      </CommonWrapper>
    );
  }

  /**
   * @public
   */
  public renderScroll = (scrollType: ScrollType) => {
    const state = this.state[scrollType];

    if (!state.active) {
      return null;
    }

    const refScroll = scrollType === 'scrollY' ? this.refScrollY : this.refScrollX;
    const styles = scrollType === 'scrollY' ? this.getScrollYStyle() : this.getScrollXStyle();
    const handleMouseDown = scrollType === 'scrollY' ? this.handleScrollMouseDown : this.handleScrollXMouseDown;

    return <div ref={refScroll} style={styles.inline} className={styles.className} onMouseDown={handleMouseDown} />;
  };

  /**
   * @public
   * @param {HTMLElement} element
   */
  public scrollTo(element: HTMLElement) {
    if (!element || !this.inner) {
      return;
    }
    const maxScroll = element.offsetTop;
    if (this.inner.scrollTop > maxScroll) {
      this.inner.scrollTop = maxScroll;
      return;
    }

    const minScroll = element.offsetTop + element.scrollHeight - this.inner.offsetHeight;
    if (this.inner.scrollTop < minScroll) {
      this.inner.scrollTop = minScroll;
    }
  }

  /**
   * @public
   */
  public scrollToTop() {
    if (!this.inner) {
      return;
    }
    this.inner.scrollTop = 0;
  }

  /**
   * @public
   */
  public scrollToBottom() {
    if (!this.inner) {
      return;
    }
    this.inner.scrollTop = this.inner.scrollHeight - this.inner.offsetHeight;
  }

  private getScrollYStyle = () => {
    const state = this.state['scrollY'];
    const props = this.props;

    return {
      className: cn({
        [jsStyles.scroll()]: true,
        [jsStyles.scrollInvert()]: Boolean(props.invert),
        [jsStyles.scrollHover()]: state.hover || state.scrolling,
      }),
      inline: {
        top: state.pos,
        height: state.size,
      },
    };
  };

  private getScrollXStyle = () => {
    const state = this.state['scrollX'];
    const props = this.props;

    return {
      className: cn({
        [jsStyles.scrollX()]: true,
        [jsStyles.scrollInvert()]: Boolean(props.invert),
        [jsStyles.scrollXHover()]: state.hover || state.scrolling,
      }),
      inline: {
        left: state.pos,
        width: state.size,
      },
    };
  };

  private refInner = (element: HTMLElement | null) => {
    if (!this.inner && element && this.props.preventWindowScroll) {
      element.addEventListener('wheel', this.handleInnerScrollWheel, { passive: false });
    }
    if (this.inner && !element) {
      this.inner.removeEventListener('wheel', this.handleInnerScrollWheel);
    }
    this.inner = element;
  };

  private refScrollY = (element: HTMLElement | null) => {
    if (!this.scrollY && element) {
      element.addEventListener('wheel', this.handleScrollWheel, { passive: false });
    }
    if (this.scrollY && !element) {
      this.scrollY.removeEventListener('wheel', this.handleScrollWheel);
    }
    this.scrollY = element;
  };

  private refScrollX = (element: HTMLElement | null) => {
    if (!this.scrollY && element) {
      // element.addEventListener('wheel', this.handleScrollWheel, { passive: false });
    }
    if (this.scrollX && !element) {
      // this.scrollX.removeEventListener('wheel', this.handleScrollWheel);
    }
    this.scrollX = element;
  };

  private handleNativeScroll = (event: React.UIEvent<HTMLDivElement>) => {
    this.reflowY();
    this.reflowX();
    this.props.onScroll?.(event);
    if (this.props.preventWindowScroll) {
      event.preventDefault();
      return;
    }
    LayoutEvents.emit();
  };

  private reflowY = () => {
    if (!this.inner) {
      return;
    }

    const state = this.state['scrollY'];
    const containerHeight = this.inner.offsetHeight - HIDE_SCROLLBAR_OFFSET;
    const contentHeight = this.inner.scrollHeight;
    const scrollTop = this.inner.scrollTop;

    const scrollActive = containerHeight < contentHeight;

    if (!scrollActive && !state.active) {
      return;
    }

    let scrollSize = 0;
    let scrollPos = 0;
    let scrollState = state.scrollState;

    if (scrollActive) {
      scrollSize = Math.max((containerHeight / contentHeight) * containerHeight, MIN_SCROLL_SIZE);
      scrollPos = (scrollTop / (contentHeight - containerHeight)) * (containerHeight - scrollSize);
    }

    if (state.active !== scrollActive || state.size !== scrollSize || state.pos !== scrollPos) {
      scrollState = this.getImmediateScrollState();

      if (scrollState !== state.scrollState) {
        this.props.onScrollStateChange?.(scrollState);
      }

      this.setState({
        ...this.state,
        scrollY: {
          ...this.state.scrollY,
          active: scrollActive,
          size: scrollSize,
          pos: scrollPos,
          scrollState,
        },
      });
    }
  };

  private reflowX = () => {
    if (!this.inner) {
      return;
    }

    const state = this.state['scrollX'];
    const containerWidth = this.inner.offsetWidth - HIDE_SCROLLBAR_OFFSET;
    const contentWidth = this.inner.scrollWidth;
    const scrollLeft = this.inner.scrollLeft;

    const scrollActive = containerWidth < contentWidth;

    if (!scrollActive && !state.active) {
      return;
    }

    let scrollSize = 0;
    let scrollPos = 0;
    const scrollState = state.scrollState;

    if (scrollActive) {
      scrollSize = Math.max((containerWidth / contentWidth) * containerWidth, MIN_SCROLL_SIZE);
      scrollPos = (scrollLeft / (contentWidth - containerWidth)) * (containerWidth - scrollSize);
    }

    if (state.active !== scrollActive || state.size !== scrollSize || state.pos !== scrollPos) {
      // scrollState = this.getImmediateScrollState();

      if (scrollState !== state.scrollState) {
        this.props.onScrollStateChange?.(scrollState);
      }

      this.setState({
        ...this.state,
        scrollX: {
          ...this.state.scrollX,
          active: scrollActive,
          size: scrollSize,
          pos: scrollPos,
          scrollState: 'scroll',
        },
      });
    }
  };

  private handleScrollMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!this.inner) {
      return;
    }

    const target: Document = window.document;
    const initialY = event.clientY;
    const initialScrollTop = this.inner.scrollTop;

    const mouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!this.inner) {
        return;
      }

      const ratioY =
        (this.inner.scrollHeight - this.inner.offsetHeight) / (this.inner.offsetHeight - this.state.scrollY.size);
      const deltaY = (mouseMoveEvent.clientY - initialY) * ratioY;

      this.inner.scrollTop = initialScrollTop + deltaY;

      if (mouseMoveEvent.preventDefault) {
        mouseMoveEvent.preventDefault();
      }

      if (Object.prototype.hasOwnProperty.call(mouseMoveEvent, 'returnValue')) {
        (mouseMoveEvent as MouseEvent & {
          returnValue: boolean;
        }).returnValue = false;
      }
    };

    const mouseUp = () => {
      target.removeEventListener('mousemove', mouseMove);
      target.removeEventListener('mouseup', mouseUp);
      this.setState({ ...this.state, scrollY: { ...this.state.scrollY, scrolling: false } });
    };

    target.addEventListener('mousemove', mouseMove);
    target.addEventListener('mouseup', mouseUp);

    this.setState({ ...this.state, scrollY: { ...this.state.scrollY, scrolling: false } });

    event.preventDefault();
  };

  private handleScrollXMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!this.inner) {
      return;
    }

    const target: Document = window.document;
    const initialX = event.clientX;
    const initialScrollLeft = this.inner.scrollLeft;

    const mouseMove = (mouseMoveEvent: MouseEvent) => {
      if (!this.inner) {
        return;
      }

      const ratioX =
        (this.inner.scrollWidth - this.inner.offsetWidth) / (this.inner.offsetWidth - this.state.scrollX.size);
      const deltaX = (mouseMoveEvent.clientX - initialX) * ratioX;

      this.inner.scrollLeft = initialScrollLeft + deltaX;

      if (mouseMoveEvent.preventDefault) {
        mouseMoveEvent.preventDefault();
      }

      if (Object.prototype.hasOwnProperty.call(mouseMoveEvent, 'returnValue')) {
        (mouseMoveEvent as MouseEvent & {
          returnValue: boolean;
        }).returnValue = false;
      }
    };

    const mouseUp = () => {
      target.removeEventListener('mousemove', mouseMove);
      target.removeEventListener('mouseup', mouseUp);
      this.setState({ ...this.state, scrollX: { ...this.state.scrollX, scrolling: false } });
    };

    target.addEventListener('mousemove', mouseMove);
    target.addEventListener('mouseup', mouseUp);
    this.setState({ ...this.state, scrollX: { ...this.state.scrollX, scrolling: false } });

    event.preventDefault();
  };

  private handleScrollWheel = (event: Event) => {
    if (!this.inner || !(event instanceof WheelEvent)) {
      return;
    }

    if (event.deltaY > 0 && this.inner.scrollHeight <= this.inner.scrollTop + this.inner.offsetHeight) {
      return;
    }
    if (event.deltaY < 0 && this.inner.scrollTop <= 0) {
      return;
    }

    this.inner.scrollTop += event.deltaY;
    event.preventDefault();
  };

  private handleInnerScrollWheel = (event: Event) => {
    if (!this.inner || !(event instanceof WheelEvent)) {
      return;
    }

    if (this.state.scrollY.active) {
      if (event.deltaY > 0 && this.inner.scrollHeight <= this.inner.scrollTop + this.inner.offsetHeight) {
        event.preventDefault();
        return false;
      }
      if (event.deltaY < 0 && this.inner.scrollTop <= 0) {
        event.preventDefault();
        return false;
      }
    }
  };

  private handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const right = event.currentTarget.getBoundingClientRect().right - event.pageX;
    const bottom = event.currentTarget.getBoundingClientRect().bottom - event.pageY;

    this.setHoverrScrollY(right <= 12);
    this.setHoverScrollX(bottom <= 12);
  };

  private handleMouseLeave = () => {
    this.setHoverrScrollY(false);
    this.setHoverScrollX(false);
  };

  private setHoverrScrollY(hover: boolean) {
    if (this.state.scrollY.hover !== hover) {
      this.setState({ ...this.state, scrollY: { ...this.state.scrollY, hover } });
    }
  }

  private setHoverScrollX(hover: boolean) {
    if (this.state.scrollX.hover !== hover) {
      this.setState({ ...this.state, scrollX: { ...this.state.scrollX, hover } });
    }
  }

  private getImmediateScrollState(): ScrollContainerScrollState {
    if (!this.inner || this.inner.scrollTop === 0) {
      return 'top';
    } else if (this.inner.scrollTop === this.inner.scrollHeight - this.inner.clientHeight) {
      return 'bottom';
    } else {
      return 'scroll';
    }
  }
}
