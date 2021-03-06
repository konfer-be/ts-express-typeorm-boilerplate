import * as Jimp from 'jimp';

import { unlink, existsSync } from 'fs';
import { promisify } from 'es6-promisify';
import { expectationFailed } from '@hapi/boom';

import { Media } from '@models/media.model';
import { resize } from '@config/environment.config';
import { IMAGE_MIME_TYPE } from '@enums/mime-type.enum';

const SIZES = Object.keys(resize.sizes).map(key => key);

const rescale = (media: Media): void => {
  void Jimp.read(media.path)
    .then( (image) => {
      SIZES
        .forEach( size => {
          image
            .clone()
            .resize(resize.sizes[size], Jimp.AUTO)
            .write(`${media.path.split('/').slice(0, -1).join('/').replace(resize.destinations.master, resize.destinations.scale)}/${size}/${media.filename as string}`, (err: Error) => {
              if(err) throw expectationFailed(err.message);
            });
        });
    })
    .catch();
}

const remove = (media: Media): void => {
  const ulink = promisify(unlink) as (path: string) => Promise<void|Error>;
  if ( !IMAGE_MIME_TYPE[media.mimetype] && existsSync(media.path.toString()) ) {
    void ulink(media.path.toString());
  } else {
    const promises = SIZES
      .map( size => media.path.toString().replace(resize.destinations.master, `${resize.destinations.scale}/${size}`) )
      .filter( path => existsSync(path) )
      .map( path => ulink(path) );
    void Promise.all( [ existsSync(media.path.toString()) ? ulink( media.path.toString() ) : Promise.resolve() ].concat( promises ) );
  }
};

export { rescale, remove }