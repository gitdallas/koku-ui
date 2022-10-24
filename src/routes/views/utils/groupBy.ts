import type { Query } from 'api/queries/query';
import { orgUnitIdKey, tagPrefix } from 'api/queries/query';

export const getGroupById = (query: Query) => {
  const groupBys = query && query.group_by ? Object.keys(query.group_by) : [];
  return groupBys.find(key => key !== orgUnitIdKey);
};

export const getGroupByValue = (query: Query) => {
  const groupById = getGroupById(query);
  return groupById ? query.group_by[groupById] : undefined;
};

export const getGroupByOrgValue = (query: Query) => {
  let groupByOrg;

  if (query && query.group_by) {
    for (const groupBy of Object.keys(query.group_by)) {
      if (groupBy === orgUnitIdKey) {
        groupByOrg = query.group_by[orgUnitIdKey];
        break;
      }
    }
  }
  return groupByOrg;
};

export const getGroupByTagKey = (query: Query) => {
  let groupByTagKey;

  if (query && query.group_by) {
    for (const groupBy of Object.keys(query.group_by)) {
      const tagIndex = groupBy.indexOf(tagPrefix);
      if (tagIndex !== -1) {
        groupByTagKey = groupBy.substring(tagIndex + tagPrefix.length) as any;
        break;
      }
    }
  }
  return groupByTagKey;
};
