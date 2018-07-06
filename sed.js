const exec = require('child_process').exec;
const os = require("os");

const shell1 = ['sed', '-i']
const shell2 = ["'s/const /var /g' dist/*.js"]

function callBack(err, stdout, stderr) {
    if (err)
        console.error(err)
    if (stdout)
        console.log(stdout)
    if (stderr)
        console.error(stderr)
}

if (os.platform() === "darwin") {
    exec(shell1.concat("\"\"").concat(shell2).join(" "), callBack)
} else {
    exec(shell1.concat(shell2).join(" "), callBack)
}
