class HttpError extends Error {
  constructor (code, msgLong, msgShort) {
    super();
    this.code = code || this.constructor.defaultCode;
    this.msgShort = msgShort || this.constructor.defaultMsgShort;
    this.msgLong = msgLong || this.constructor.defaultMsgLong || '';
    this.status = this.constructor.status;
    // For compatibility with the Error class:
    this.message = this.msgLong || this.msgShort || this.code;
  }

  toPlainObject () {
    return {
      status: this.status,
      code: `#${this.code}`,
      short: this.msgShort,
      long: this.msgLong,
    };
  }
}

class HttpBadRequestError extends HttpError {};
HttpBadRequestError.status = 400;
HttpBadRequestError.defaultCode = 'badRequest';
HttpBadRequestError.defaultMsgShort = 'Bad request.';

class HttpUnauthorizedError extends HttpError {};
HttpUnauthorizedError.status = 401;
HttpUnauthorizedError.defaultCode = 'unauthorized';
HttpUnauthorizedError.defaultMsgShort = 'Not authorized.';
HttpUnauthorizedError.defaultMsgLong = 'You need to provide a valid API access key and wallet password.';

class HttpPaymentRequiredError extends HttpError {};
HttpPaymentRequiredError.status = 402;
HttpPaymentRequiredError.defaultCode = 'paymentRequired';
HttpPaymentRequiredError.defaultMsgShort = 'Payment required.';
HttpPaymentRequiredError.defaultMsgLong = 'Not enough ether balance in your wallet.';

class HttpForbiddenError extends HttpError {};
HttpForbiddenError.status = 403;
HttpForbiddenError.defaultCode = 'forbidden';
HttpForbiddenError.defaultMsgShort = 'Forbidden.';

class Http404Error extends HttpError {};
Http404Error.status = 404;
Http404Error.defaultCode = 'notFound';
Http404Error.defaultMsgShort = 'Page not found.';
Http404Error.defaultMsgLong = 'This endpoint does not exist.';

class HttpValidationError extends HttpError {};
HttpValidationError.status = 422;
HttpValidationError.defaultCode = 'validationFailed';
HttpValidationError.defaultMsgShort = 'Validation did not pass.';

class HttpInternalError extends HttpError {};
HttpInternalError.status = 500;
HttpInternalError.defaultCode = 'genericError';
HttpInternalError.defaultMsgShort = 'Something went wrong.';
HttpInternalError.defaultMsgLong = 'Something went wrong. Please contact the administrator.';

class HttpBadGatewayError extends HttpError {};
HttpBadGatewayError.status = 502;
HttpBadGatewayError.defaultCode = 'badGatewayError';
HttpBadGatewayError.defaultMsgShort = 'Bad gateway.';
HttpBadGatewayError.defaultMsgLong = 'Invalid response from an upstream server.';

module.exports = {
  HttpError,
  HttpUnauthorizedError,
  HttpPaymentRequiredError,
  HttpForbiddenError,
  Http404Error,
  HttpBadRequestError,
  HttpValidationError,
  HttpInternalError,
  HttpBadGatewayError,
};
