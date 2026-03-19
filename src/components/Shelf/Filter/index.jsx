import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
import { updateFilters } from '../../../services/filters/actions';
import Checkbox from '../../CheckBox';

import './style.scss';

class Filter extends Component {
  static propTypes = {
    updateFilters: PropTypes.func.isRequired,
    filters: PropTypes.object,
    products: PropTypes.array,
    allProducts: PropTypes.array
  };

  toggleCheckbox = label => {
    const { filters = {} } = this.props;
    const selectedVendors = filters.items || [];
    const nextFilters = selectedVendors.includes(label)
      ? selectedVendors.filter(item => item !== label)
      : [...selectedVendors, label];

    this.props.updateFilters({ items: nextFilters });
  };

  clearFilters = () => {
    this.props.updateFilters({
      items: [],
      search: '',
      minPrice: '',
      maxPrice: ''
    });
  };

  updateMinPrice = event => {
    const nextMinPrice = Number(event.target.value);
    const { filters = {} } = this.props;
    const maxProductPrice = this.getMaxProductPrice();
    const currentMax = filters.maxPrice === '' ? maxProductPrice : Number(filters.maxPrice);

    this.props.updateFilters({
      minPrice: String(nextMinPrice),
      maxPrice: String(Math.max(nextMinPrice, currentMax))
    });
  };

  updateMaxPrice = event => {
    const nextMaxPrice = Number(event.target.value);
    const { filters = {} } = this.props;
    const minProductPrice = this.getMinProductPrice();
    const currentMin = filters.minPrice === '' ? minProductPrice : Number(filters.minPrice);

    this.props.updateFilters({
      minPrice: String(Math.min(currentMin, nextMaxPrice)),
      maxPrice: String(nextMaxPrice)
    });
  };

  createCheckbox = label => (
    <Checkbox
      classes="filters-available-size"
      label={label}
      checked={(this.props.filters.items || []).includes(label)}
      handleCheckboxChange={this.toggleCheckbox}
      key={label}
    />
  );

  getAvailableVendors = () => {
    const { allProducts = [] } = this.props;
    const products = allProducts.length > 0 ? allProducts : this.props.products || [];
    return [...new Set(products.flatMap(product => product.availableSizes || []))];
  };

  getMinProductPrice = () => {
    const { allProducts = [] } = this.props;
    const products = allProducts.length > 0 ? allProducts : this.props.products || [];
    if (products.length === 0) {
      return 0;
    }

    return Math.min(...products.map(product => Number(product.price) || 0));
  };

  getMaxProductPrice = () => {
    const { allProducts = [] } = this.props;
    const products = allProducts.length > 0 ? allProducts : this.props.products || [];
    if (products.length === 0) {
      return 0;
    }

    return Math.max(...products.map(product => Number(product.price) || 0));
  };

  render() {
    const isFavouritesPage =
      typeof window !== 'undefined' && window.location.href.indexOf('/favourites') >= 0;

    if (isFavouritesPage) {
      return <></>;
    }

    const availableVendors = this.getAvailableVendors();
    const { minPrice = '', maxPrice = '' } = this.props.filters;
    const minProductPrice = this.getMinProductPrice();
    const maxProductPrice = this.getMaxProductPrice();
    const rawMinSliderValue = minPrice === '' ? minProductPrice : Number(minPrice);
    const rawMaxSliderValue = maxPrice === '' ? maxProductPrice : Number(maxPrice);
    const minSliderValue = Math.max(minProductPrice, Math.min(rawMinSliderValue, maxProductPrice));
    const maxSliderValue = Math.max(minSliderValue, Math.min(rawMaxSliderValue, maxProductPrice));

    return (
      <div className="filters">
        <h4 className="title">Vendors:</h4>
        {availableVendors.map(this.createCheckbox)}
        <h4 className="title filters-subtitle">Price Range:</h4>
        <div className="filters-price-slider-wrap">
          <small className="filters-price-label">Min: ${minSliderValue}</small>
          <input
            type="range"
            min={minProductPrice}
            max={maxSliderValue}
            step="1"
            className="filters-price-slider"
            value={minSliderValue}
            onChange={this.updateMinPrice}
            disabled={maxProductPrice === 0}
          />
          <small className="filters-price-label">Max: ${maxSliderValue}</small>
          <input
            type="range"
            min={minSliderValue}
            max={maxProductPrice}
            step="1"
            className="filters-price-slider"
            value={maxSliderValue}
            onChange={this.updateMaxPrice}
            disabled={maxProductPrice === 0}
          />
          <small className="filters-price-label">
            Range: ${minSliderValue} - ${maxSliderValue}
          </small>
        </div>
        <button type="button" className="filters-clear" onClick={this.clearFilters}>
          Clear all
        </button>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  filters: state.filters,
  products: state.shelf.products || [],
  allProducts: state.shelf.allProducts || []
});

export default connect(
  mapStateToProps,
  { updateFilters }
)(Filter);
