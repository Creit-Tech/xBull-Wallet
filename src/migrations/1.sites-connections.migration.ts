import { ISiteConnection } from '~root/state';

/*
* Add host and origin to saved sites connections
* */
export const sitesConnectionsMigration = (entity: ISiteConnection): void => {
  if (!entity.docVersion || entity.docVersion < 1) {
    const [ origin, host ] = entity._id.split('_');
    entity.host = host;
    entity.origin = origin;
    entity.docVersion = 1;
  }
};
