import PropTypes from 'prop-types';
import React, { PureComponent, Children } from 'react';
import { View, ScrollView, Animated, Platform, ViewPropTypes } from 'react-native';

import Indicator from '../indicator';
import styles from './styles';

export default class Pages extends PureComponent {
  static defaultProps = {
    pagingEnabled: true,
    showsHorizontalScrollIndicator: false,
    showsVerticalScrollIndicator: false,
    scrollEventThrottle: 30,
    scrollsToTop: false,

    style: styles.container,

    indicatorColor: 'rgb(255, 255, 255)',
    indicatorOpacity: 0.30,

    horizontal: true,
    rtl: false,
  };

  static propTypes = {
    style: ViewPropTypes.style,

    indicatorColor: PropTypes.string,
    indicatorOpacity: PropTypes.number,
    indicatorPosition: PropTypes.oneOf([
      'none',
      'top',
      'right',
      'bottom',
      'left',
    ]),

    horizontal: PropTypes.bool,
    rtl: PropTypes.bool,

    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),

    onLayout: PropTypes.func,
    onScrollEnd: PropTypes.func,
    renderPager: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.onLayout = this.onLayout.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onScrollBeginDrag = this.onScrollBeginDrag.bind(this);
    this.onScrollEndDrag = this.onScrollEndDrag.bind(this);

    this.updateRef = this.updateRef.bind(this, 'scroll');
    this.renderPage = this.renderPage.bind(this);

    this.progress = 0;
    this.scrollState = -1;

    this.state = {
      width: 0,
      height: 0,
      progress: new Animated.Value(0),
    };
  }

  componentDidUpdate() {
    if (-1 === this.scrollState) {
      /* Fix scroll position after layout update */
      this.scrollToPage(Math.floor(this.progress), false);
    }
  }

  updateRef(name, ref) {
    this[name] = ref;
  }

  onLayout(event) {
    let { width, height } = event.nativeEvent.layout;
    let { onLayout } = this.props;

    if ('function' === typeof onLayout) {
      onLayout(event);
    }

    this.setState({ width, height });
  }

  onScroll(event) {
    let { horizontal } = this.props;
    let { [horizontal? 'x' : 'y']: offset } = event.nativeEvent.contentOffset;
    let { [horizontal? 'width' : 'height']: base, progress } = this.state;

    progress.setValue(this.progress = base? offset / base : 0);

    if (1 === this.scrollState && !(offset % base)) {
      this.onScrollEnd(progress);

      this.scrollState = -1;
    }
  }

  onScrollBeginDrag() {
    this.scrollState = 0;
  }

  onScrollEndDrag() {
    let { horizontal } = this.props;

    /* Vertical pagination is not working on android, scroll by hands */
    if ('android' === Platform.OS && !horizontal) {
      this.scrollToPage(Math.round(this.progress));
    }

    this.scrollState = 1;
  }

  onScrollEnd(page) {
    let { onScrollEnd } = this.props;

    if ('function' === typeof onScrollEnd) {
      onScrollEnd(page);
    }
  }

  scrollToPage(page, animated = true) {
    let { horizontal } = this.props;
    let { [horizontal? 'width' : 'height']: base } = this.state;

    this.scroll.scrollTo({
      [horizontal? 'x' : 'y']: page * base,
      animated,
    });
  }

  isDragging() {
    return 0 === this.scrollState;
  }

  isDecelerating() {
    return 1 === this.scrollState;
  }

  renderPage(page, index) {
    let { width, height, progress } = this.state;
    let { children, horizontal, rtl } = this.props;

    let pages = Children.count(children);

    let style = [
      { width, height },
      (horizontal && rtl)? styles.rtl : null,
    ];

    /* Adjust progress by page index */
    progress = Animated.add(progress, -index);

    return (
      <View style={style}>
        {React.cloneElement(page, { index, pages, progress })}
      </View>
    );
  }

  renderPager(pager) {
    let { renderPager, horizontal, rtl } = this.props;

    if ('function' === typeof renderPager) {
      return renderPager({ horizontal, rtl, ...pager });
    }

    let { indicatorPosition } = pager;

    if ('none' === indicatorPosition) {
      return null;
    }

    let style = [
      styles[indicatorPosition],
      (horizontal && rtl)? styles.rtl : null,
    ];

    return (
      <View style={style}>
        <Indicator {...pager} />
      </View>
    );
  }

  render() {
    let { progress } = this.state;
    let { horizontal, rtl } = this.props;
    let {
      style,
      children,
      indicatorColor,
      indicatorOpacity,
      indicatorPosition = horizontal? 'bottom' : 'right',
      ...props
    } = this.props;

    let pages = Children.count(children);

    let Pager = () =>
      this.renderPager({
        pages,
        progress,
        indicatorColor,
        indicatorOpacity,
        indicatorPosition,
      });

    let scrollStyle = [
      styles.container,
      (horizontal && rtl)? styles.rtl : null,
    ];

    return (
      <View style={style}>
        <ScrollView
          {...props}
          style={scrollStyle}
          onLayout={this.onLayout}
          onScroll={this.onScroll}
          onScrollBeginDrag={this.onScrollBeginDrag}
          onScrollEndDrag={this.onScrollEndDrag}
          ref={this.updateRef}
        >
          {Children.map(children, this.renderPage)}
        </ScrollView>

        <Pager />
      </View>
    );
  }
}