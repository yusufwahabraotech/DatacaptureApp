import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const NavigationService = {
  navigate(name, params) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    }
  },

  isReady() {
    return navigationRef.isReady();
  },

  reset(state) {
    if (navigationRef.isReady()) {
      navigationRef.reset(state);
    }
  },

  goBack() {
    if (navigationRef.isReady()) {
      navigationRef.goBack();
    }
  }
};