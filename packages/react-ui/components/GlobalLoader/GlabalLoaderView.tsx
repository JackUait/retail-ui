import React from 'react';

import { AnimationKeyframes } from '../../lib/theming/AnimationKeyframes';
import { Theme } from '../../lib/theming/Theme';
import { cx } from '../../lib/theming/Emotion';
import { ZIndex } from '../../internal/ZIndex';
import { ThemeContext } from '../../lib/theming/ThemeContext';

import { GlobalLoaderProps } from './GlobalLoader';
import { styles } from './GlobalLoaderView.styles';

interface GlobalLoaderViewProps extends GlobalLoaderProps {
  isGlobalLoaderVisible?: boolean;
  downloadSuccess: boolean;
}

export class GlobalLoaderView extends React.Component<GlobalLoaderViewProps> {
  private theme!: Theme;

  public render() {
    return (
      <ThemeContext.Consumer>
        {(theme) => {
          this.theme = theme;
          return this.renderMain();
        }}
      </ThemeContext.Consumer>
    );
  }

  private renderMain() {
    return (
      this.props.isGlobalLoaderVisible && (
        <ZIndex priority="GlobalLoader" className={styles.outer(this.theme)}>
          <div
            className={cx(styles.inner(this.theme), {
              [styles.fullWidth()]: this.props.downloadSuccess,
            })}
            style={{
              animation: this.getAnimation(),
            }}
          />
        </ZIndex>
      )
    );
  }
  private getAnimation(): string {
    const waitingFactor = this.theme.globalLoaderWaitingFactor;
    const transitionDuration = this.theme.globalLoaderTransitionDuration; // ms
    const spinnerAnimationDuration = this.theme.globalLoaderSpinnerAnimationDuration; //ms

    const standardAnimation = `${AnimationKeyframes.globalLoaderProgress()} ${
      this.props.expectedResponseTime
    }ms linear, ${
      this.props.expectedResponseTime! * waitingFactor
    }ms ${AnimationKeyframes.globalLoaderSlowProgress()} ${
      this.props.expectedResponseTime
    }ms ease-out, ${transitionDuration}ms ${AnimationKeyframes.globalLoaderMoveToRight()} ${
      this.props.expectedResponseTime! * (waitingFactor + 1)
    }ms linear, ${spinnerAnimationDuration}ms ${AnimationKeyframes.globalLoaderSpinner()} ${
      this.props.expectedResponseTime! * (waitingFactor + 1) + transitionDuration
    }ms infinite alternate`;

    const errorAnimation = `${AnimationKeyframes.globalLoaderMoveToRight()} ${transitionDuration}ms linear, ${spinnerAnimationDuration}ms ${AnimationKeyframes.globalLoaderSpinner()} ${transitionDuration}ms infinite alternate`;

    const successAnimation = 'none';

    if (this.props.downloadSuccess) {
      return successAnimation;
    }
    if (this.props.rejected) {
      return errorAnimation;
    }
    return standardAnimation;
  }
}
