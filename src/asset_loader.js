const AssetLoader = {
  images: {},
  spritesheets: {},
  baseUrl: "./assets/",
  sounds: {},

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

  loadSound: async function (id, filename, vol = 1) {
    this.sounds[id] = await loadSound(this.prefix(filename));
    this.sounds[id].volume = vol;
  },
};
