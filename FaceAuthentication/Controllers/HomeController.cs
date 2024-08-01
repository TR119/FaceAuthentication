using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;
using FaceRecognitionDotNet;

namespace FaceAuthentication.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }



        public ActionResult About()
        {
            return View();
        }

        [HttpPost]
         public JsonResult FaceCheck(HttpPostedFileBase FaceImage)
         {
             if (FaceImage == null)
                 return Json(new { isError = true });
             var contentRootPath = Server.MapPath("~/");
             var uploadsFolder = Path.Combine(contentRootPath, "Storage", "FaceData", "Temp");
             var fileName = Guid.NewGuid().ToString() + Path.GetFileName(FaceImage.FileName) ;
             var filePath = Path.Combine(uploadsFolder, fileName);
             string directoryPath = Path.GetDirectoryName(filePath);

             if (!Directory.Exists(directoryPath))
             {
                 Directory.CreateDirectory(directoryPath);
             }
             FaceImage.SaveAs(filePath);
             var isAllowed = CompareFace(filePath);
             if (isAllowed)
             {
                 return Json(new
                 {
                     Msg = "Thành công",
                     Status = 200,
                     Data = "/Home/About",
                 },JsonRequestBehavior.AllowGet);
             }
             else
             {
                 return Json(new
                 {
                     Msg = "Thất bại",
                     Status = 400,
                     Data = ""
                 }, JsonRequestBehavior.AllowGet);
             }
         }
         public bool CompareFace(string uploadedFacePath)
         {
             try
             {
                 FaceRecognition.InternalEncoding = Encoding.GetEncoding(932);

                 var contentRootPath = Server.MapPath("~/");
                 string modelsDirectory = Path.Combine(contentRootPath, "Models");
                 var pathImageDefault = Path.Combine(contentRootPath, "Storage", "FaceData", "Temp", "default.png");
                 var fr = FaceRecognition.Create(modelsDirectory);

                 // Tải ảnh đã lưu
                 var uploadedImage = FaceRecognition.LoadImageFile(uploadedFacePath);
                 var defaultImage = FaceRecognition.LoadImageFile(pathImageDefault);

                 // Nhận diện khuôn mặt và mã hóa khuôn mặt cho ảnh tải lên
                 IEnumerable<Location> uploadedImageLocations = fr.FaceLocations(uploadedImage);
                 IEnumerable<FaceEncoding> uploadedImageEncodings = fr.FaceEncodings(uploadedImage, uploadedImageLocations);

                 // Nhận diện khuôn mặt và mã hóa khuôn mặt cho ảnh mặc định
                 IEnumerable<Location> defaultImageLocations = fr.FaceLocations(defaultImage);
                 IEnumerable<FaceEncoding> defaultImageEncodings = fr.FaceEncodings(defaultImage, defaultImageLocations);

                 if (uploadedImageEncodings.Any() && defaultImageEncodings.Any())
                 {
                     const double tolerance = 0.4d;
                     bool match = FaceRecognition.CompareFace(uploadedImageEncodings.First(), defaultImageEncodings.First(), tolerance);

                     if (System.IO.File.Exists(uploadedFacePath))
                     {
                         System.IO.File.Delete(uploadedFacePath);
                     }

                     return match;
                 }

                 if (System.IO.File.Exists(uploadedFacePath))
                 {
                     System.IO.File.Delete(uploadedFacePath);
                 }

                 return false;
             }
             catch (Exception e)
             {
                 return false;
             }
            
         }

       
    }
}