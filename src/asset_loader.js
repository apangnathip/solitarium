// class AssetLoader {
//   constructor() {
//     this.images = {};
//     this.spritesheets = {};
//     this.baseUrl
//   }
//
//   prefix(filename) {
//     return "./assets/" + filename;
//   }
//
//   static async loadImage(id, filename) {
//     this.images[id] = loadImage(url);
//   }
//
//   static async loadSpritesheet(id, imgName, xmlName) {
//     const img = loadImage(imgUrl);
//     const atlas = loadXML(xmlUrl);
//     this.spritesheets[id] = [img, atlas];
//   }
// }

const AssetLoader = {
  images: {},
  spritesheets: {},
  baseUrl: "./assets/",

  prefix: function (filename) {
    return this.baseUrl + filename;
  },

  loadImage: async function (id, filename) {
    const url = this.prefix(filename);
    this.images[id] = await loadImage(url);
  },

  loadSpritesheet: async function (id, imgName, xmlName) {
    const img = await loadImage(this.prefix(imgName));
    const xml = await loadXML(this.prefix(xmlName));
    this.spritesheets[id] = [img, parseTextureAtlas(xml)];
  },
};
