import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View, Animated, ViewPropTypes } from 'react-native';

import styles from './styles';

export default class Indicator extends PureComponent {
  static propTypes = {
    style: ViewPropTypes.style,

    pages: PropTypes.number.isRequired,
    progress: PropTypes.instanceOf(Animated.Value).isRequired,
    activeIndicatorColor: PropTypes.string.isRequired,
    inactiveIndicatorColor: PropTypes.string,
    indicatorOpacity: PropTypes.number.isRequired,
    indicatorPosition: PropTypes.oneOf([
      'top',
      'right',
      'bottom',
      'left',
    ]).isRequired,
  };

  render() {
    let {
      pages,
      progress,
      activeIndicatorColor,
      inactiveIndicatorColor,
      indicatorOpacity,
      indicatorPosition,
      style,
      indicatorContainerStyle,
      ...props
    } = this.props;

    let dots = Array.from(new Array(pages), (page, index) => {
      let opacity = 1.0;
      let backgroundColor = activeIndicatorColor;
      if (!inactiveIndicatorColor) {
        opacity = progress
          .interpolate({
            inputRange: [
              -Infinity,
              index - 1,
              index,
              index + 1,
              Infinity,
            ],
            outputRange: [
              indicatorOpacity,
              indicatorOpacity,
              1.0,
              indicatorOpacity,
              indicatorOpacity,
            ],
          });
      } else {
        backgroundColor = progress
          .interpolate({
            inputRange: [
              -Infinity,
              index - 1,
              index,
              index + 1,
              Infinity,
            ],
            outputRange: [
              inactiveIndicatorColor,
              inactiveIndicatorColor,
              activeIndicatorColor,
              inactiveIndicatorColor,
              inactiveIndicatorColor,
            ],
          });
      }

      let style = { opacity, backgroundColor };

      return (
        <Animated.View style={[styles.dot, indicatorContainerStyle, style]} key={index} />
      );
    });

    let flexDirection = /^(top|bottom)$/
      .test(indicatorPosition)?
        'row':
        'column';

    return (
      <View style={[styles.container, { flexDirection }, style]} {...props}>
        {dots}
      </View>
    );
  }
}
