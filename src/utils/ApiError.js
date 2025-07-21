class ApiError extends Error {
  constructor(statusCode, message="SOMETHING_WENT_WRONG", errors = [],stack="") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data=NULL;
   
    this.success = false;
    this.message= message
    if(stack)
    {
         this.stack = stack; 
    }
    else{
        Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError};
