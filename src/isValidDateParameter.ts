const dateRegex = /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/;

export default (d: any) : boolean => {
  return typeof d === "string" && dateRegex.test(d) && !isNaN(new Date(d).valueOf());
}