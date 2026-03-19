import { UPDATE_FILTER } from './actionTypes';

const initialState = {
  items: [],
  search: '',
  minPrice: '',
  maxPrice: ''
};

export default function filtersReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_FILTER:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}
