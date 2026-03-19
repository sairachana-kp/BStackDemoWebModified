import { FETCH_PRODUCTS, SET_FAVOURITE_PRODUCT } from './actionTypes';
import store2 from 'store2';
import axios from '../axios';

const compare = {
  lowestprice: (a, b) => {
    if (a.price < b.price) return -1;
    if (a.price > b.price) return 1;
    return 0;
  },
  highestprice: (a, b) => {
    if (a.price > b.price) return -1;
    if (a.price < b.price) return 1;
    return 0;
  }
};

export const setFavProduct = product => dispatch => {
  dispatch({
    type: SET_FAVOURITE_PRODUCT,
    payload: product
  });
};

export const fetchProducts = (filters, sortBy, callback) => dispatch => {
  const userName = store2.session.get('username');
  return axios
    .get('/api/products', { params: { userName } })
    .then(res => {
      const allProducts = res.data.products || [];
      let products = [...allProducts];
      const selectedVendors = (filters && filters.items) || [];
      const searchText = ((filters && filters.search) || '').trim().toLowerCase();
      const hasMinPrice =
        filters && filters.minPrice !== '' && filters.minPrice !== null && filters.minPrice !== undefined;
      const hasMaxPrice =
        filters && filters.maxPrice !== '' && filters.maxPrice !== null && filters.maxPrice !== undefined;
      const minPrice = hasMinPrice ? Number(filters.minPrice) : null;
      const maxPrice = hasMaxPrice ? Number(filters.maxPrice) : null;

      if (selectedVendors.length > 0) {
        products = products.filter(p =>
          selectedVendors.find(f => p.availableSizes.find(size => size === f))
        );
      }

      if (searchText) {
        products = products.filter(product => {
          const title = (product.title || '').toLowerCase();
          const description = (product.description || '').toLowerCase();
          return title.includes(searchText) || description.includes(searchText);
        });
      }

      if (minPrice !== null && !Number.isNaN(minPrice)) {
        products = products.filter(product => product.price >= minPrice);
      }

      if (maxPrice !== null && !Number.isNaN(maxPrice)) {
        products = products.filter(product => product.price <= maxPrice);
      }

      if (!!sortBy) {
        products = [...products].sort(compare[sortBy]);
      }

      if (!!callback) {
        callback();
      }

      return dispatch({
        type: FETCH_PRODUCTS,
        payload: {
          products,
          allProducts
        }
      });
    })
    .catch(err => {
      console.log('Could not fetch products. Try again later.');
    });
};
