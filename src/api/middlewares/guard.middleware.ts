import { authenticate } from 'passport';
import { promisify } from 'es6-promisify';
import { forbidden, badRequest } from '@hapi/boom';

import { User } from '@models/user.model';
import { ROLES } from '@enums/role.enum';
import { list } from '@utils/enum.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { IResponse } from '@interfaces/IResponse.interface';

/**
 * @description Callback function provided to passport.authenticate with JWT strategy
 *
 * @param req Express request object derived from http.incomingMessage
 * @param res Express response object
 * @param next Callback function
 * @param roles Authorized roles
 */
const handleJWT = (req: IUserRequest, res: IResponse, next: (error?: Error) => void, roles: string|string[]) => async (err: Error, user: User, info: string) => {

  const error = err || info;
  const logIn = promisify(req.logIn) as ( user, { session } ) => Promise<void>;

  try {
    if (error || !user) throw error;
    await logIn(user, { session: false });
  } catch (e) {
    return next( forbidden(e) );
  }

  if (roles === ROLES.user && user.role !== ROLES.admin && parseInt(req.params.userId, 10) !== user.id ) {
    return next( forbidden('Forbidden area') );
  } else if (!roles.includes(user.role)) {
    return next( forbidden('Forbidden area') );
  } else if (err || !user) {
    return next( badRequest(err?.message) );
  }

  req.user = user;

  return next();
};

/**
 * @description Authorize user access according to role(s) in arguments
 *
 * @param roles
 *
 * @dependency passport
 * @see http://www.passportjs.org/
 */
const Authorize = (roles = list(ROLES)) => (req: IUserRequest, res: IResponse, next: (e?: Error) => void): void => authenticate( 'jwt', { session: false }, handleJWT(req, res, next, roles) )(req, res, next);


/**
 * @description Authorize user access according to service.access_token
 *
 * @param service Service to use for authentication
 *
 * @dependency passport
 * @see http://www.passportjs.org/
 */
const Oauth = (service: string) => authenticate(service, { session: false });

export { Authorize, Oauth }