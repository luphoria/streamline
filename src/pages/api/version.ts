// get the version of the server from the package.json file
export async function GET() {
  return new Response(process.env.npm_package_version);
}