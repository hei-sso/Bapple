// components/checkbox.ts

import { StyleSheet } from 'react-native';

export const CheckBox = StyleSheet.create({
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cfcfcfff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemLabel: {
    fontSize: 15,
    marginLeft: 10
  }
});
