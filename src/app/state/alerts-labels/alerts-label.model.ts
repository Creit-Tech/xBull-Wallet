export interface IAlertsLabel {
  _id: string;
  type: 'domain';
  level: 'warning' | 'danger';
  value: string;
  message: string;
}

export function createAlertsLabel(params: Omit<IAlertsLabel, '_id'>): IAlertsLabel {
  return {
    _id: `${params.type}_${params.value}`,
    type: params.type,
    level: params.level,
    value: params.value,
    message: params.message,
  };
}
