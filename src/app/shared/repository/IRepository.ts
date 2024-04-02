import { IRead } from './IRead';
import { IWrite } from './IWrite';

/**
 * Contract that is fulfilled by a full crud
 * @author: Carlos Rodríguez
 */
export interface IRepository<T> extends IWrite<T>, IRead<T> {}
