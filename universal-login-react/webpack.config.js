const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/playground/main.tsx',
  output: {
    filename: 'main.[hash].js',
    path: path.join(__dirname, '/dist/html'),
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          reportFiles: [
            '!../node_modules/nock/types/index.d.ts',
            '!node_modules/nock/types/index.d.ts',
          ],
        },
      },
      {enforce: 'pre', test: /\.js$/, loader: 'source-map-loader'},
      {
        test: /\.(png|jpg|gif|svg|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]',
            },
          },
        ],
      },
      {
        test: /\.s?[ac]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    new Dotenv(),
    new webpack.DefinePlugin({
      'process.env.TOKENS': JSON.stringify(process.env.TOKENS),
      'process.env.SAI_TOKEN_ADDRESS': JSON.stringify(process.env.SAI_TOKEN_ADDRESS),
      'process.env.RELAYER_URL': JSON.stringify(process.env.RELAYER_URL),
      'process.env.ENS_DOMAINS': JSON.stringify(process.env.ENS_DOMAINS),
      'process.env.JSON_RPC_URL': JSON.stringify(process.env.JSON_RPC_URL),
    }),
  ],
  devServer: {
    historyApiFallback: true,
    host: '0.0.0.0',
    compress: true,
    stats: 'errors-only',
  },
  node: {
    fs: 'empty',
  },
  stats: 'minimal',
};
