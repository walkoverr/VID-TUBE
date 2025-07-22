// const asyncHandler = (fn) => (req, res, next) => {
//     return (req, res, next) => {
//         Promise.resolve(fn(req, res, next)).catch((err)=>
//             next(err)
//         );
//     };
// };
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export {asyncHandler};
