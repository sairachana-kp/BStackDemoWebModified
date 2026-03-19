import { FETCH_PRODUCTS, SET_FAVOURITE_PRODUCT } from './actionTypes';

const initialState = {
  products: [],
  allProducts: []
};

export default function shelfReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_PRODUCTS:
      return {
        ...state,
        products: action.payload.products,
        allProducts: action.payload.allProducts
      };
    case SET_FAVOURITE_PRODUCT:
      const toggleFav = product =>
        product.id === action.payload.id ? { ...product, isFav: !product.isFav } : product;

      const products = state.products.map(toggleFav);
      const allProducts = state.allProducts.map(toggleFav);

      return {
        ...state,
        products,
        allProducts
      };
    default:
      return state;
  }
}
