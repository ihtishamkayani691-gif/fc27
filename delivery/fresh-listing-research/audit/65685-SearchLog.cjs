// Exact production webpack module 65685 from inspected FC Enhancer v7.2.
module.exports = (e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.addSearchResultsToLog=void 0;const a=n(51477);t.addSearchResultsToLog=async(e,t)=>{const{data:{results:n,critieria:i},params:{data:{cache:r}}}=e;return a.Logger.writeSearchResultsToLog(n,r.nextPageNumber,i),t(e)}};
