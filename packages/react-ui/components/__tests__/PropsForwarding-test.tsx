import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import * as ReactUI from '../../index';

const PUBLIC_COMPONENTS = Object.keys(ReactUI).filter(name => {
  return (
    isPublicComponent((ReactUI as any)[name]) &&
    !['LocaleProvider', 'LocaleConsumer', 'ThemeProvider', 'ThemeConsumer'].includes(name)
  );
});

// some components have required props
// so we need this in order to create them dynamically
// also we pass values to inputs to check their forwarding
const DEFAULT_PROPS = {
  Autocomplete: { value: 'value', onValueChange: jest.fn() },
  FxInput: { value: 'value', onValueChange: jest.fn() },
  CurrencyInput: { value: 0, onValueChange: jest.fn() },
  CurrencyLabel: { value: '' },
  DatePicker: { value: '00.00.0000', onValueChange: jest.fn() },
  ComboBox: { value: { label: 'value', value: 0 }, getItems: () => Promise.resolve([]) },
  TokenInput: { type: ReactUI.TokenInputType.Combined, getItems: () => Promise.resolve([]), onValueChange: jest.fn() },
  Radio: { value: 'value' },
  RadioGroup: { items: [] },
  Dropdown: { caption: 'caption' },
  DropdownMenu: { caption: 'caption' },
  Fias: { baseUrl: '/' },
  FiasSearch: { api: new ReactUI.FiasAPI('/') },
  Gapped: { children: '' },
  MenuHeader: { children: '' },
  Paging: { activePage: 0, onPageChange: jest.fn(), pagesCount: 0 },
  Sticky: { side: 'top' },
  Switcher: { value: 'value', items: [] },
  Tabs: { value: '' },
  TooltipMenu: { caption: 'caption' },
  TopBarDropdown: { label: 'label' },
  TopBarUser: { userName: 'name' },
  TopBarOrganizations: { caption: 'caption' },
  Hint: { text: 'Hint', manual: true, opened: true, children: <i /> },
  Tooltip: { trigger: 'opened', render: () => 'Tooltip', children: <i /> },
  Toast: { children: <i /> },
  Tab: { id: 'tab' },
  Input: { value: 'value' },
  Toggle: { value: 'value' },
  Checkbox: { value: 'value' },
  PasswordInput: { value: 'value' },
  Select: { value: 'value' },
  Button: { value: 'value' },
};

// allows rendering Tab not only inside Tabs
// by mocking throwing module
jest.mock('invariant', () => (...args: any[]) => {
  if (args[1] !== 'Tab should be placed inside Tabs component') {
    jest.requireActual('invariant')(...args);
  }
});

const createWrapper = <T extends {}>(compName: string, initProps: object = {}) => {
  const component = (ReactUI as any)[compName];
  const props = { ...(DEFAULT_PROPS as any)[compName], ...initProps };
  return mount<T>(React.createElement(component, props));
};

describe('Props Forwarding', () => {
  describe('Common Props', () => {
    const getTestDOMNode = (compName: string, wrapper: ReactWrapper) => {
      switch (compName) {
        case 'Hint':
        case 'Tooltip':
          return wrapper
            .find('Portal')
            .last()
            .getDOMNode();
        case 'Toast':
          (wrapper as ReactWrapper<{}, {}, ReactUI.Toast>).instance().push('Tast');
          wrapper.update();
          return wrapper.find('ToastView').getDOMNode();
        default:
          return wrapper.getDOMNode();
      }
    };

    it.each<[string, ReactWrapper]>(PUBLIC_COMPONENTS.map(name => [name, createWrapper(name)]))(
      '%s',
      (compName, wrapper) => {
        const props = {
          'data-tid': 'my-data-tid',
          'data-testid': 'my-data-testid',
          className: 'my-classname',
          style: {
            width: '95.5%',
            color: 'red',
          },
        };
        wrapper.setProps(props);

        const wrapperNode = getTestDOMNode(compName, wrapper);

        expect(wrapperNode.getAttribute('data-tid')).toBe(props['data-tid']);
        expect(wrapperNode.getAttribute('data-testid')).toBe(props['data-testid']);
        expect(wrapperNode.classList.contains(props.className)).toBe(true);
        expect(getComputedStyle(wrapperNode)).toMatchObject(props.style);
      },
    );
  });

  describe("Form Element's Props", () => {
    const getTestWrapper = (compName: string, wrapper: ReactWrapper) => {
      switch (compName) {
        case 'TokenInput':
        case 'Textarea':
          return wrapper.find('textarea');
        case 'Button':
        case 'Select':
          return wrapper.find('button');
        default:
          return wrapper.find('input');
      }
    };

    it.each<string>([
      'Input',
      'FxInput',
      'CurrencyInput',
      'PasswordInput',
      'Autocomplete',
      'DateInput',
      'DatePicker',
      'ComboBox',
      'TokenInput',
      'Checkbox',
      'Radio',
      'Switcher',
      'Toggle',
      // 'Select',
      'Button',
    ])('%s', compName => {
      const props: React.InputHTMLAttributes<HTMLInputElement> = {
        // global attributes
        id: 'my-id',
        tabIndex: 15,

        // form elements
        autoComplete: 'my-autocomplete',
        autoFocus: true,
        disabled: true,
        name: 'my-name',
        form: 'my-form',

        // accessibility
        'aria-label': 'label',
        'aria-labelledby': 'element',
      };
      const wrapper = createWrapper(compName, props);

      const testWrapper = getTestWrapper(compName, wrapper);

      expect(testWrapper.props()).toMatchObject(props);
      expect(testWrapper.prop('value')).toBeDefined();
    });
  });

  describe("Input's Specific Props", () => {
    it.each<string>([
      'Input',
      'FxInput',
      'Autocomplete',
      'ComboBox',
      // 'TokenInput', // uses <textarea /> instead of <input />
    ])('%s', compName => {
      const props: React.InputHTMLAttributes<HTMLInputElement> = {
        accept: 'my-accept', //	          file
        capture: 'my-capture', //	        file
        list: 'my-list', //	              almost all
        max: 15, //	                      numeric
        maxLength: 15, //	                password, search, tel, text, url
        min: 15, //	                      numeric
        minLength: 15, //	                password, search, tel, text, url
        multiple: true, //	              email, file
        pattern: '*', //	                password, text, tel
        placeholder: 'my-placeholder', //	password, search, tel, text, url
        readOnly: true, //	              almost all
        step: '15', //	                  numeric
        type: 'tel', //                   all
        required: true, //                all
      };
      const wrapper = createWrapper(compName, props);

      if (compName === 'ComboBox') {
        // ComboBox renders <InputLikeText />
        // instead of <input /> while not it focus
        wrapper.find('span[tabIndex]').simulate('focus');
      }

      expect(wrapper.find('input').props()).toMatchObject(props);
    });
  });

  describe('"width" Prop', () => {
    const getTestDOMNode = (compName: string, wrapper: ReactWrapper) => {
      switch (compName) {
        case 'Modal':
          return wrapper.find('[data-tid~="modal-content"] > div').getDOMNode();
        case 'SidePage':
          return wrapper.find('div[data-tid~="SidePage__root"]').getDOMNode();
        case 'TokenInput':
          return wrapper.find('label').getDOMNode();
        default:
          return wrapper.getDOMNode();
      }
    };

    it.each<keyof typeof ReactUI>([
      'Button',
      'ComboBox',
      'DateInput',
      'DatePicker',
      'Dropdown',
      'FxInput',
      'Group',
      'Input',
      'RadioGroup',
      'Select',
      'Textarea',
      'Modal',
      'SidePage',
      'Tabs',
      'TokenInput',
    ])('%s', compName => {
      const width = '99px';
      const wrapper = createWrapper(compName, { width });
      const testDOMNode = getTestDOMNode(compName, wrapper);

      expect(getComputedStyle(testDOMNode).width).toBe(width);
    });
  });
});

export function isPublicComponent(component: any) {
  // it's either ClassComponent or FunctionalComponent with Kontur's mark
  return (
    typeof component === 'function' &&
    (component.prototype.isReactComponent || Object.prototype.hasOwnProperty.call(component, '__KONTUR_REACT_UI__'))
  );
}
