module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: 'http://167.99.227.46:3002/:path*',
      },
    ]
  },
}
