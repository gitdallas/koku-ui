import type { Providers } from 'api/providers';
import { fetchProviders as apiGetSources } from 'api/providers';
import type { AxiosResponse } from 'axios';
import { AxiosError } from 'axios';
import type { Dispatch } from 'redux';
import { createAction, createAsyncAction } from 'typesafe-actions';

interface FilterQuery {
  currentFilterType?: string;
  currentFilterValue?: string;
}

export const updateFilterToolbar = createAction('fetch/source/filter')<FilterQuery>();

export const {
  request: fetchSourcesRequest,
  success: fetchSourcesSuccess,
  failure: fetchSourcesFailure,
} = createAsyncAction('fetch/source/request', 'fetch/source/success', 'fetch/source/failure')<
  void,
  AxiosResponse<Providers>,
  AxiosError
>();

export const fetchSources = (query: string = '') => {
  return (dispatch: Dispatch) => {
    dispatch(fetchSourcesRequest());

    return apiGetSources(query)
      .then(res => {
        dispatch(fetchSourcesSuccess(res));
      })
      .catch(err => {
        dispatch(fetchSourcesFailure(err));
      });
  };
};
